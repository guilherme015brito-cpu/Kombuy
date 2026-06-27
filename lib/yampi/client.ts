import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getYampiConfig } from "@/lib/yampi";
import { forceRefreshYampiAccessToken, getValidYampiAccessToken } from "@/lib/yampi/token-manager";
import type { YampiInstallationRecord } from "@/lib/yampi/types";
import { YampiSafeError } from "@/lib/yampi/types";

const yampiApiBaseUrl = "https://api.dooki.com.br/v2";
const requestTimeoutMs = 15000;

type YampiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = windowlessSetTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

function windowlessSetTimeout(callback: () => void, ms: number) {
  return setTimeout(callback, ms);
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as unknown;
  }

  return await response.text();
}

async function executeRequest(url: string, accessToken: string, options: YampiRequestOptions) {
  const { config } = getYampiConfig();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "X-Partner-Client-ID": config.clientId,
    Accept: "application/json",
    ...options.headers
  };

  let body: BodyInit | undefined;

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  return fetchWithTimeout(url, {
    method: options.method || "GET",
    headers,
    body
  });
}

export async function yampiRequest(
  supabase: SupabaseClient,
  installation: YampiInstallationRecord,
  path: string,
  options: YampiRequestOptions = {}
) {
  if (!installation.merchant_alias) {
    throw new YampiSafeError("Alias da loja Yampi nao encontrado.", 404);
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${yampiApiBaseUrl}${normalizedPath}`;
  let tokenState = await getValidYampiAccessToken(supabase, installation);
  let response = await executeRequest(url, tokenState.accessToken || "", options);

  if (response.status === 401) {
    tokenState = await forceRefreshYampiAccessToken(supabase, tokenState.installation);
    response = await executeRequest(url, tokenState.accessToken || "", options);
  }

  const payload = await parseResponse(response);

  if (!response.ok) {
    if (response.status === 403) {
      throw new YampiSafeError("Permissao ou escopo insuficiente para consultar a Yampi.", 403);
    }

    if (response.status === 404) {
      throw new YampiSafeError("Endpoint ou alias da loja Yampi nao encontrado.", 404);
    }

    throw new YampiSafeError(`Falha segura na API da Yampi. HTTP ${response.status}.`, response.status);
  }

  return {
    payload,
    installation: tokenState.installation,
    status: response.status
  };
}
