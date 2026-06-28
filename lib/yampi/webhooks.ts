import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { yampiRequest } from "@/lib/yampi/client";
import type { YampiInstallationRecord } from "@/lib/yampi/types";

export const kombuyWebhookName = "Kombuy - Eventos da loja";

export const yampiWebhookEvents = [
  "order.created",
  "order.paid",
  "order.status.updated",
  "transaction.payment.refused",
  "cart.reminder",
  "customer.created",
  "customer.address.created"
];

export type YampiWebhookRecord = {
  id: number | null;
  name: string | null;
  url: string | null;
  events: string[];
  status: string | null;
  secret_key: string | null;
  created_at: string | null;
};

export function buildKombuyWebhookUrl(merchantAlias: string) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://kombuy.vercel.app").replace(/\/$/, "");
  const url = new URL("/api/yampi/webhook", appUrl);
  url.searchParams.set("merchant_alias", merchantAlias);
  return url.toString();
}

function safeRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function extractList(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload;
  }

  const record = safeRecord(payload);
  const data = record.data;

  if (Array.isArray(data)) {
    return data;
  }

  const nestedData = safeRecord(data).data;
  return Array.isArray(nestedData) ? nestedData : [];
}

function stringOrNull(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : null;
}

function numberOrNull(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeEvents(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((event) => String(event)).filter(Boolean);
}

export function normalizeWebhookRecord(value: unknown): YampiWebhookRecord {
  const record = safeRecord(value);
  const data = safeRecord(record.data);
  const source = Object.keys(data).length > 0 ? data : record;

  return {
    id: numberOrNull(source.id || source.webhook_id),
    name: stringOrNull(source.name),
    url: stringOrNull(source.url),
    events: normalizeEvents(source.events),
    status: stringOrNull(source.status) || "configurado",
    secret_key: stringOrNull(source.secret_key),
    created_at: stringOrNull(source.created_at)
  };
}

export async function listYampiWebhooks(supabase: SupabaseClient, installation: YampiInstallationRecord) {
  const response = await yampiRequest(supabase, installation, `/${installation.merchant_alias}/webhooks`);
  return extractList(response.payload).map(normalizeWebhookRecord);
}

export async function createYampiWebhook(
  supabase: SupabaseClient,
  installation: YampiInstallationRecord,
  webhookUrl: string
) {
  const response = await yampiRequest(supabase, installation, `/${installation.merchant_alias}/webhooks`, {
    method: "POST",
    body: {
      url: webhookUrl,
      events: yampiWebhookEvents,
      name: kombuyWebhookName
    }
  });

  return normalizeWebhookRecord(response.payload);
}

export function findMatchingWebhook(webhooks: YampiWebhookRecord[], webhookUrl: string) {
  return webhooks.find((webhook) => webhook.url === webhookUrl || webhook.name === kombuyWebhookName) || null;
}
