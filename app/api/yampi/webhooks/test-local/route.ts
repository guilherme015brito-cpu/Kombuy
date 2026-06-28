import { NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/admin";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { calculateYampiWebhookSignature, verifyYampiWebhookSignature } from "@/lib/yampi/webhook-signature";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireAdminForApi();

  if (auth.response) {
    return auth.response;
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, message: "Teste local de webhook nao e permitido em producao." },
      { status: 403 }
    );
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json({ success: false, message: "Supabase nao configurado." }, { status: 500 });
  }

  const { data: installation } = await supabase
    .from("yampi_instalacoes")
    .select("id,merchant_alias,webhook_secret")
    .eq("status", "ativa")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!installation?.webhook_secret || !installation.merchant_alias) {
    return NextResponse.json(
      { success: false, message: "Instalacao sem webhook_secret para teste local." },
      { status: 400 }
    );
  }

  const rawBody = JSON.stringify({
    event: "order.created",
    event_id: `local-test-${Date.now()}`,
    merchant_alias: installation.merchant_alias
  });
  const signature = calculateYampiWebhookSignature(rawBody, installation.webhook_secret);
  const valid = verifyYampiWebhookSignature(rawBody, signature, installation.webhook_secret);

  return NextResponse.json({
    success: valid,
    merchant_alias: installation.merchant_alias,
    message: valid
      ? "Calculo HMAC validado localmente sem registrar evento real."
      : "Falha na validacao HMAC local."
  });
}
