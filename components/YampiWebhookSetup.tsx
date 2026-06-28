"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SetupResult = {
  success: boolean;
  webhook_id?: number | null;
  webhook_status?: string;
  events?: string[];
  message: string;
};

export function YampiWebhookSetup() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SetupResult | null>(null);

  async function setupWebhook() {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/yampi/webhooks/setup", {
        method: "POST"
      });
      const data = (await response.json()) as SetupResult;
      setResult({
        ...data,
        message: data.message || (response.ok ? "Webhook configurado." : "Nao foi possivel configurar o webhook.")
      });

      if (response.ok && data.success) {
        router.refresh();
      }
    } catch {
      setResult({
        success: false,
        message: "Nao foi possivel configurar o webhook agora."
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-brand-line bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-brand-navy">Webhook da Yampi</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Cadastra ou reutiliza o webhook oficial da Kombuy para receber eventos da loja.
          </p>
        </div>
        <button
          type="button"
          disabled={isLoading}
          onClick={setupWebhook}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-green px-5 py-3 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isLoading ? "Configurando..." : "Configurar webhook"}
        </button>
      </div>

      {result ? (
        <div className={result.success ? "mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800" : "mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800"}>
          <p>{result.message}</p>
          {result.success ? (
            <p className="mt-1">
              ID: {result.webhook_id || "-"} | Status: {result.webhook_status || "-"} | Eventos: {result.events?.length || 0}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
