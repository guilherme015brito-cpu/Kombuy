import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getYampiConfig, getYampiMissingEnvMessage } from "@/lib/yampi";

export const dynamic = "force-dynamic";

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  loja_id?: string | number;
  loja_nome?: string;
  merchant_id?: string | number;
  merchant_name?: string;
  merchant?: {
    id?: string | number;
    name?: string;
  };
  seller?: {
    id?: string | number;
    name?: string;
  };
  [key: string]: unknown;
};

function redirectToAdmin(request: Request, status: string, message?: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const baseUrl = appUrl || new URL(request.url).origin;
  const url = new URL("/admin/integracoes/yampi", baseUrl);
  url.searchParams.set("status", status);

  if (message) {
    url.searchParams.set("mensagem", message);
  }

  return NextResponse.redirect(url);
}

function getMerchantId(token: TokenResponse) {
  return String(token.loja_id || token.merchant_id || token.merchant?.id || token.seller?.id || "").trim() || null;
}

function getMerchantName(token: TokenResponse) {
  return String(token.loja_nome || token.merchant_name || token.merchant?.name || token.seller?.name || "").trim() || null;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");

  if (!code) {
    return redirectToAdmin(request, "erro", "A Yampi nao retornou o codigo de autorizacao.");
  }

  const { config, missing, isConfigured } = getYampiConfig();

  if (!isConfigured) {
    return redirectToAdmin(request, "erro", getYampiMissingEnvMessage(missing));
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return redirectToAdmin(request, "erro", "Supabase nao configurado para salvar a instalacao.");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    state: state || "",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri
  });

  let token: TokenResponse;

  try {
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json"
      },
      body
    });

    token = (await response.json()) as TokenResponse;

    if (!response.ok || !token.access_token) {
      return redirectToAdmin(request, "erro", "Nao foi possivel trocar o codigo pelo token da Yampi.");
    }
  } catch {
    return redirectToAdmin(request, "erro", "Falha de comunicacao com a Yampi.");
  }

  const expiresAt =
    typeof token.expires_in === "number"
      ? new Date(Date.now() + token.expires_in * 1000).toISOString()
      : null;

  const { error } = await supabase.from("yampi_instalacoes").insert({
    loja_id: getMerchantId(token),
    loja_nome: getMerchantName(token),
    access_token: token.access_token,
    refresh_token: token.refresh_token || null,
    scope: token.scope || null,
    token_expires_at: expiresAt,
    status: "ativa"
  });

  if (error) {
    return redirectToAdmin(request, "erro", "Token recebido, mas nao foi possivel salvar a instalacao.");
  }

  return redirectToAdmin(request, "conectado");
}
