import { NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/admin";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { YampiInstallationRecord } from "@/lib/yampi/types";
import { YampiSafeError } from "@/lib/yampi/types";
import {
  buildKombuyWebhookUrl,
  createYampiWebhook,
  findMatchingWebhook,
  listYampiWebhooks,
  yampiWebhookEvents
} from "@/lib/yampi/webhooks";

export const dynamic = "force-dynamic";

function webhookStatusFrom(value: string | null) {
  if (!value) {
    return "configurado";
  }

  return value === "ativo" || value === "active" ? "ativo" : "configurado";
}

export async function POST() {
  const auth = await requireAdminForApi();

  if (auth.response) {
    return auth.response;
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json({ success: false, message: "Supabase nao configurado." }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("yampi_instalacoes")
    .select("*")
    .eq("status", "ativa")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ success: false, message: "Nenhuma instalacao ativa da Yampi foi encontrada." }, { status: 404 });
  }

  const installation = data as YampiInstallationRecord;

  if (!installation.merchant_alias) {
    return NextResponse.json({ success: false, message: "Alias da loja Yampi nao encontrado." }, { status: 400 });
  }

  const webhookUrl = buildKombuyWebhookUrl(installation.merchant_alias);

  try {
    const existingWebhooks = await listYampiWebhooks(supabase, installation);
    const existingWebhook = findMatchingWebhook(existingWebhooks, webhookUrl);
    const webhook = existingWebhook || (await createYampiWebhook(supabase, installation, webhookUrl));
    const webhookStatus = webhookStatusFrom(webhook.status);

    const update = {
      webhook_id: webhook.id,
      webhook_secret: webhook.secret_key || installation.webhook_secret,
      webhook_url: webhook.url || webhookUrl,
      webhook_status: webhookStatus,
      webhook_events: webhook.events.length > 0 ? webhook.events : yampiWebhookEvents,
      webhook_created_at: webhook.created_at || installation.webhook_created_at || new Date().toISOString(),
      webhook_last_error: null,
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase.from("yampi_instalacoes").update(update).eq("id", installation.id);

    if (updateError) {
      return NextResponse.json({ success: false, message: "Webhook encontrado, mas nao foi possivel salvar a configuracao." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      webhook_id: webhook.id,
      webhook_status: webhookStatus,
      events: update.webhook_events,
      message: existingWebhook ? "Webhook existente reutilizado com sucesso." : "Webhook criado com sucesso."
    });
  } catch (caughtError) {
    const status = caughtError instanceof YampiSafeError ? caughtError.status : 500;
    const message = caughtError instanceof YampiSafeError ? caughtError.message : "Nao foi possivel configurar o webhook da Yampi.";

    await supabase
      .from("yampi_instalacoes")
      .update({
        webhook_status: "erro",
        webhook_last_error: message,
        updated_at: new Date().toISOString()
      })
      .eq("id", installation.id);

    return NextResponse.json(
      {
        success: false,
        webhook_status: "erro",
        events: yampiWebhookEvents,
        message: `${message} HTTP ${status}.`
      },
      { status: status >= 400 && status < 600 ? status : 500 }
    );
  }
}
