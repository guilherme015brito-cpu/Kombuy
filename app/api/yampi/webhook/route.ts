import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

function parsePayload(rawBody: string) {
  try {
    return JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return { raw: rawBody };
  }
}

function getEventType(payload: Record<string, unknown>) {
  const value = payload.event || payload.type || payload.name || payload.topic;
  return typeof value === "string" && value.trim() ? value.trim() : "evento_desconhecido";
}

function headersToObject(headers: Headers) {
  const result: Record<string, string> = {};

  headers.forEach((value, key) => {
    result[key] = value;
  });

  return result;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const payload = parsePayload(rawBody);
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json({ received: true, saved: false }, { status: 200 });
  }

  const { error } = await supabase.from("yampi_webhook_logs").insert({
    event_type: getEventType(payload),
    payload,
    headers: headersToObject(request.headers)
  });

  return NextResponse.json({ received: true, saved: !error }, { status: 200 });
}

export function GET() {
  return NextResponse.json({ ok: true, message: "Webhook da Yampi ativo." });
}
