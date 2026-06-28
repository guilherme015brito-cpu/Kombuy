import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { verifyYampiWebhookSignature } from "@/lib/yampi/webhook-signature";

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
  const value = payload.event;
  const event = typeof value === "string" && value.trim() ? value.trim() : "evento_desconhecido";
  return recognizedEvents.has(event) ? event : event;
}

function getEventIdentifier(rawBody: string) {
  return createHash("sha256").update(rawBody).digest("hex");
}

function getStoreId(payload: Record<string, unknown>) {
  const data = payload.data && typeof payload.data === "object" ? (payload.data as Record<string, unknown>) : {};
  const value = payload.loja_id || payload.merchant_id || payload.store_id || data.loja_id || data.merchant_id || data.store_id;
  return typeof value === "string" || typeof value === "number" ? String(value) : null;
}

function headersToSafeObject(headers: Headers) {
  const result: Record<string, string> = {};
  const allowed = new Set(["content-type", "user-agent"]);

  headers.forEach((value, key) => {
    const normalizedKey = key.toLowerCase();

    if (allowed.has(normalizedKey)) {
      result[normalizedKey] = value;
    }
  });

  return result;
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const merchantAlias = requestUrl.searchParams.get("merchant_alias");
  const rawBody = await request.text();
  const signature = request.headers.get("X-Yampi-Hmac-SHA256");
  const supabase = getSupabaseAdmin();

  if (!merchantAlias || !supabase) {
    return NextResponse.json({ received: false, error: "Webhook nao configurado." }, { status: 401 });
  }

  const { data: installation } = await supabase
    .from("yampi_instalacoes")
    .select("id,loja_id,merchant_alias,webhook_secret")
    .eq("merchant_alias", merchantAlias)
    .maybeSingle();

  if (!installation?.webhook_secret || !verifyYampiWebhookSignature(rawBody, signature, installation.webhook_secret)) {
    return NextResponse.json({ received: false, error: "Assinatura invalida." }, { status: 401 });
  }

  const payload = parsePayload(rawBody);
  const eventId = getEventIdentifier(rawBody);
  const eventType = getEventType(payload);
  const logPayload = {
    loja_id: getStoreId(payload) || installation.loja_id,
    event_type: eventType,
    evento: eventType,
    event_id: eventId,
    payload,
    headers: headersToSafeObject(request.headers)
  };

  const saveResult = await supabase.from("yampi_webhook_logs").upsert(logPayload, { onConflict: "event_id" });

  await supabase
    .from("yampi_instalacoes")
    .update({
      webhook_last_received_at: new Date().toISOString(),
      webhook_last_event: eventType,
      webhook_status: "ativo",
      webhook_last_error: saveResult.error ? "Evento recebido, mas nao foi possivel salvar o log." : null,
      updated_at: new Date().toISOString()
    })
    .eq("id", installation.id);

  return NextResponse.json({ received: true, saved: !saveResult.error }, { status: 200 });
}

export function GET() {
  return NextResponse.json({ ok: false, error: "Metodo nao permitido." }, { status: 405 });
}
