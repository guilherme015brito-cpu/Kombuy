import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getYampiConfig, getYampiMissingEnvMessage } from "@/lib/yampi";
import {
  clearYampiOauthCookies,
  createYampiAuthorizationRedirect,
  isValidState,
  yampiStateCookie,
  yampiVerifierCookie
} from "@/lib/yampi-oauth";

export const dynamic = "force-dynamic";

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
  scope?: string;
  loja_id?: string | number;
  loja_nome?: string;
  merchant_alias?: string;
  merchant_id?: string | number;
  merchant_name?: string;
  merchant?: {
    id?: string | number;
    name?: string;
    alias?: string;
  };
  seller?: {
    id?: string | number;
    name?: string;
    alias?: string;
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

function redirectWithClearedCookies(request: Request, status: string, message?: string) {
  return clearYampiOauthCookies(redirectToAdmin(request, status, message));
}

function stringFromUnknown(value: unknown) {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim() || null;
  }

  return null;
}

function getStoreId(token: TokenResponse, merchantFromUrl: string | null) {
  return (
    stringFromUnknown(token.loja_id) ||
    stringFromUnknown(token.merchant_id) ||
    stringFromUnknown(token.merchant?.id) ||
    stringFromUnknown(token.seller?.id) ||
    merchantFromUrl
  );
}

function getStoreName(token: TokenResponse, merchantAlias: string | null) {
  return (
    stringFromUnknown(token.loja_nome) ||
    stringFromUnknown(token.merchant_name) ||
    stringFromUnknown(token.merchant?.name) ||
    stringFromUnknown(token.seller?.name) ||
    merchantAlias
  );
}

function getMerchantAlias(token: TokenResponse, merchantFromUrl: string | null) {
  return (
    merchantFromUrl ||
    stringFromUnknown(token.merchant_alias) ||
    stringFromUnknown(token.merchant?.alias) ||
    stringFromUnknown(token.seller?.alias)
  );
}

function expiresAt(seconds: unknown) {
  return typeof seconds === "number" && Number.isFinite(seconds)
    ? new Date(Date.now() + seconds * 1000).toISOString()
    : null;
}

function expiresAtWithDefault(seconds: unknown, defaultSeconds: number) {
  return expiresAt(seconds) || new Date(Date.now() + defaultSeconds * 1000).toISOString();
}

async function readTokenResponse(response: Response) {
  try {
    return (await response.json()) as TokenResponse;
  } catch {
    return {} as TokenResponse;
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const merchant = requestUrl.searchParams.get("merchant");
  const oauthError = requestUrl.searchParams.get("error");

  if (oauthError === "access_denied") {
    return redirectWithClearedCookies(request, "erro", "A autorizacao da Yampi foi recusada.");
  }

  if (!code) {
    return createYampiAuthorizationRedirect();
  }

  const storedState = request.cookies.get(yampiStateCookie)?.value;
  const codeVerifier = request.cookies.get(yampiVerifierCookie)?.value;

  if (!isValidState(state, storedState)) {
    return redirectWithClearedCookies(request, "erro", "State invalido. Reinicie a instalacao pela Yampi.");
  }

  if (!codeVerifier) {
    return redirectWithClearedCookies(request, "erro", "Sessao OAuth expirada. Reinicie a instalacao pela Yampi.");
  }

  const { config, missing, isConfigured } = getYampiConfig();

  if (!isConfigured) {
    return redirectWithClearedCookies(request, "erro", getYampiMissingEnvMessage(missing));
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return redirectWithClearedCookies(request, "erro", "Supabase nao configurado para salvar a instalacao.");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    code,
    code_verifier: codeVerifier
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

    token = await readTokenResponse(response);

    if (!response.ok || !token.access_token) {
      return redirectWithClearedCookies(
        request,
        "erro",
        `Falha na troca de token com a Yampi. HTTP ${response.status}.`
      );
    }
  } catch {
    return redirectWithClearedCookies(request, "erro", "Falha de comunicacao com a Yampi.");
  }

  const merchantAlias = getMerchantAlias(token, merchant);
  const installationPayload = {
    loja_id: getStoreId(token, merchant),
    loja_nome: getStoreName(token, merchantAlias),
    merchant_alias: merchantAlias,
    merchant_id: getStoreId(token, merchant),
    access_token: token.access_token,
    refresh_token: token.refresh_token || null,
    token_expires_at: expiresAtWithDefault(token.expires_in, 10 * 60),
    refresh_token_expires_at: token.refresh_token
      ? expiresAtWithDefault(token.refresh_token_expires_in, 30 * 24 * 60 * 60)
      : null,
    scope: token.scope || null,
    status: "ativa",
    updated_at: new Date().toISOString()
  };

  const existingInstallation = merchantAlias
    ? await supabase.from("yampi_instalacoes").select("id").eq("merchant_alias", merchantAlias).maybeSingle()
    : { data: null, error: null };

  const saveResult = existingInstallation.data
    ? await supabase.from("yampi_instalacoes").update(installationPayload).eq("id", existingInstallation.data.id)
    : await supabase.from("yampi_instalacoes").insert(installationPayload);

  if (existingInstallation.error || saveResult.error) {
    return redirectWithClearedCookies(request, "erro", "Token recebido, mas nao foi possivel salvar a instalacao.");
  }

  return redirectWithClearedCookies(request, "conectado");
}
