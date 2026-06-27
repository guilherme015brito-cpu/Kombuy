import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getYampiConfig } from "@/lib/yampi";
import type { YampiInstallationRecord } from "@/lib/yampi/types";
import { YampiSafeError } from "@/lib/yampi/types";

const accessTokenLifetimeSeconds = 10 * 60;
const refreshTokenLifetimeSeconds = 30 * 24 * 60 * 60;
const refreshThresholdMs = 60 * 1000;

type RefreshTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
  scope?: string;
};

function expiresAt(seconds: number) {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

function shouldRefresh(installation: YampiInstallationRecord) {
  if (!installation.access_token || !installation.token_expires_at) {
    return true;
  }

  return new Date(installation.token_expires_at).getTime() - Date.now() < refreshThresholdMs;
}

function isRefreshExpired(installation: YampiInstallationRecord) {
  if (!installation.refresh_token) {
    return true;
  }

  if (!installation.refresh_token_expires_at) {
    return false;
  }

  return new Date(installation.refresh_token_expires_at).getTime() <= Date.now();
}

async function markReauthorizationRequired(supabase: SupabaseClient, installationId: string) {
  await supabase
    .from("yampi_instalacoes")
    .update({
      status: "reautorizacao_necessaria",
      updated_at: new Date().toISOString()
    })
    .eq("id", installationId);
}

async function refreshYampiToken(supabase: SupabaseClient, installation: YampiInstallationRecord) {
  const { config, isConfigured } = getYampiConfig();

  if (!isConfigured) {
    throw new YampiSafeError("Variaveis da Yampi incompletas.", 500);
  }

  if (isRefreshExpired(installation)) {
    await markReauthorizationRequired(supabase, installation.id);
    throw new YampiSafeError("Reconecte a loja Yampi.", 401);
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: installation.refresh_token || "",
    client_id: config.clientId
  });

  let response: Response;

  try {
    response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json"
      },
      body
    });
  } catch {
    throw new YampiSafeError("Nao foi possivel renovar o token da Yampi.", 502);
  }

  let token: RefreshTokenResponse = {};

  try {
    token = (await response.json()) as RefreshTokenResponse;
  } catch {
    token = {};
  }

  if (!response.ok || !token.access_token) {
    if (response.status === 400 || response.status === 401) {
      await markReauthorizationRequired(supabase, installation.id);
    }

    throw new YampiSafeError(`Falha ao renovar token da Yampi. HTTP ${response.status}.`, response.status);
  }

  const update = {
    access_token: token.access_token,
    refresh_token: token.refresh_token || installation.refresh_token,
    token_expires_at: expiresAt(token.expires_in || accessTokenLifetimeSeconds),
    refresh_token_expires_at: token.refresh_token
      ? expiresAt(token.refresh_token_expires_in || refreshTokenLifetimeSeconds)
      : installation.refresh_token_expires_at,
    scope: token.scope || installation.scope,
    status: "ativa",
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("yampi_instalacoes")
    .update(update)
    .eq("id", installation.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new YampiSafeError("Token renovado, mas nao foi possivel atualizar a instalacao.", 500);
  }

  return data as YampiInstallationRecord;
}

export async function getValidYampiAccessToken(
  supabase: SupabaseClient,
  installation: YampiInstallationRecord
) {
  if (!shouldRefresh(installation)) {
    return {
      accessToken: installation.access_token,
      installation
    };
  }

  const refreshedInstallation = await refreshYampiToken(supabase, installation);

  return {
    accessToken: refreshedInstallation.access_token,
    installation: refreshedInstallation
  };
}

export async function forceRefreshYampiAccessToken(
  supabase: SupabaseClient,
  installation: YampiInstallationRecord
) {
  const refreshedInstallation = await refreshYampiToken(supabase, installation);

  return {
    accessToken: refreshedInstallation.access_token,
    installation: refreshedInstallation
  };
}
