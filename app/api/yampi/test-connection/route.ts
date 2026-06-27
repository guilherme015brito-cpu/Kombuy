import { NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/admin";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { yampiRequest } from "@/lib/yampi/client";
import type { YampiInstallationRecord, YampiSafeGateway, YampiSafePayment } from "@/lib/yampi/types";
import { YampiSafeError } from "@/lib/yampi/types";

export const dynamic = "force-dynamic";

function extractList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const data = record.data;

    if (Array.isArray(data)) {
      return data;
    }

    if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).data)) {
      return (data as Record<string, unknown>).data as unknown[];
    }
  }

  return [];
}

function safeRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function stringOrNull(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : null;
}

function booleanOrNull(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function summarizePayment(value: unknown): YampiSafePayment {
  const record = safeRecord(value);
  const flags = safeRecord(record.flags);

  return {
    id: stringOrNull(record.id),
    alias: stringOrNull(record.alias),
    name: stringOrNull(record.name),
    active_config: booleanOrNull(record.active_config),
    is_credit_card: Boolean(record.is_credit_card || flags.credit_card),
    is_billet: Boolean(record.is_billet || flags.billet),
    is_pix: Boolean(record.is_pix || flags.pix)
  };
}

function summarizeGateway(value: unknown): YampiSafeGateway {
  const record = safeRecord(value);

  return {
    alias: stringOrNull(record.alias),
    name: stringOrNull(record.name),
    gateway_exists: Boolean(record.alias || record.id || record.name)
  };
}

async function updateCheckStatus(
  installationId: string,
  status: number,
  message: string
) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return;
  }

  await supabase
    .from("yampi_instalacoes")
    .update({
      last_api_check_at: new Date().toISOString(),
      last_api_check_status: status,
      last_api_check_message: message,
      updated_at: new Date().toISOString()
    })
    .eq("id", installationId);
}

export async function GET() {
  const auth = await requireAdminForApi();

  if (auth.response) {
    return auth.response;
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json({ connected: false, message: "Supabase nao configurado." }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("yampi_instalacoes")
    .select("*")
    .eq("status", "ativa")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { connected: false, message: "Nenhuma instalacao ativa da Yampi foi encontrada." },
      { status: 404 }
    );
  }

  const installation = data as YampiInstallationRecord;

  try {
    const paymentsPath = `/${installation.merchant_alias}/checkout/payments`;
    const gatewaysPath = `/${installation.merchant_alias}/checkout/gateways?include=form`;
    const paymentsResponse = await yampiRequest(supabase, installation, paymentsPath);
    const gatewaysResponse = await yampiRequest(supabase, paymentsResponse.installation, gatewaysPath);
    const payments = extractList(paymentsResponse.payload).map(summarizePayment);
    const gateways = extractList(gatewaysResponse.payload).map(summarizeGateway);
    const checkedAt = new Date().toISOString();
    const message = "Conexao com a Yampi validada com sucesso.";

    await updateCheckStatus(installation.id, 200, message);

    return NextResponse.json({
      connected: true,
      merchant_alias: installation.merchant_alias,
      checked_at: checkedAt,
      payments_count: payments.length,
      gateways_count: gateways.length,
      payments,
      gateways,
      message
    });
  } catch (caughtError) {
    const status = caughtError instanceof YampiSafeError ? caughtError.status : 500;
    const message = caughtError instanceof YampiSafeError ? caughtError.message : "Falha segura ao consultar a Yampi.";

    await updateCheckStatus(installation.id, status, message);

    return NextResponse.json(
      {
        connected: false,
        merchant_alias: installation.merchant_alias,
        checked_at: new Date().toISOString(),
        payments_count: 0,
        gateways_count: 0,
        payments: [],
        gateways: [],
        message
      },
      { status: status >= 400 && status < 600 ? status : 500 }
    );
  }
}
