import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const recognizedEvents = new Set([
  "order.created",
  "order.paid",
  "order.status.updated",
  "transaction.payment.refused",
  "cart.reminder",
  "customer.created",
  "customer.address.created"
]);

function parsePayload(rawBody: string) {
  try {
    return JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return { raw: rawBody };
  }
}

function getEventType(payload: Record<string, unknown>) {
  const value = payload.event || payload.type || payload.name || payload.topic;
  const event = typeof value === "string" && value.trim() ? value.trim() : "evento_desconhecido";
  return recognizedEvents.has(event) ? event : event;
}

function getEventIdentifier(payload: Record<string, unknown>) {
  const value = payload.id || payload.event_id || payload.webhook_id || payload.uuid;
  return typeof value === "string" || typeof value === "number" ? String(value) : null;
}

function getStoreId(payload: Record<string, unknown>) {
  const data = payload.data && typeof payload.data === "object" ? (payload.data as Record<string, unknown>) : {};
  const value = payload.loja_id || payload.merchant_id || payload.store_id || data.loja_id || data.merchant_id || data.store_id;
  return typeof value === "string" || typeof value === "number" ? String(value) : null;
}

function headersToSafeObject(headers: Headers) {
  const result: Record<string, string> = {};
  const blocked = new Set(["authorization", "cookie", "set-cookie", "x-yampi-hmac-sha256"]);

  headers.forEach((value, key) => {
    if (!blocked.has(key.toLowerCase())) {
      result[key] = value;
    }
  });

  return result;
}

function isValidSignature(rawBody: string, signature: string | null) {
  const secret = process.env.YAMPI_WEBHOOK_SECRET;

  if (!secret || !signature) {
    return false;
  }

  const digest = createHmac("sha256", secret).update(rawBody).digest("base64");
  const received = Buffer.from(signature);
  const expected = Buffer.from(digest);

  if (received.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(received, expected);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("X-Yampi-Hmac-SHA256");

  if (!isValidSignature(rawBody, signature)) {
    return NextResponse.json({ received: false, error: "Assinatura invalida." }, { status: 401 });
  }

  const payload = parsePayload(rawBody);
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json({ received: true, saved: false }, { status: 200 });
  }

  const eventId = getEventIdentifier(payload);
  const logPayload = {
    loja_id: getStoreId(payload),
    evento: getEventType(payload),
    event_id: eventId,
    payload,
    headers: headersToSafeObject(request.headers)
  };

  const saveResult = eventId
    ? await supabase.from("yampi_webhook_logs").upsert(logPayload, { onConflict: "event_id" })
    : await supabase.from("yampi_webhook_logs").insert(logPayload);

  return NextResponse.json({ received: true, saved: !saveResult.error }, { status: 200 });
}

export function GET() {
  return NextResponse.json({ ok: false, error: "Metodo nao permitido." }, { status: 405 });
}
