"use client";

import { useState } from "react";

type TestPayment = {
  id: string | number | null;
  alias: string | null;
  name: string | null;
  active_config: boolean | null;
  is_credit_card: boolean;
  is_billet: boolean;
  is_pix: boolean;
};

type TestGateway = {
  alias: string | null;
  name: string | null;
  gateway_exists: boolean;
};

type TestResult = {
  connected: boolean;
  merchant_alias: string | null;
  checked_at: string;
  payments_count: number;
  gateways_count: number;
  payments: TestPayment[];
  gateways: TestGateway[];
  message: string;
};

export function YampiConnectionTester() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState("");

  async function testConnection() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/yampi/test-connection");
      const data = (await response.json()) as TestResult;
      setResult(data);

      if (!response.ok || !data.connected) {
        setError(data.message || "Nao foi possivel validar a conexao.");
      }
    } catch {
      setError("Nao foi possivel validar a conexao agora.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-brand-line bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-brand-navy">Teste real da API Yampi</h2>
          <p className="mt-1 text-sm text-slate-600">
            Consulta formas de pagamento e gateways usando a instalacao ativa mais recente.
          </p>
        </div>
        <button
          type="button"
          disabled={isLoading}
          onClick={testConnection}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-green px-5 py-3 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isLoading ? "Testando..." : "Testar conexao"}
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <ResultBlock title="Formas de pagamento" count={result.payments_count}>
            {result.payments.map((payment, index) => (
              <li key={`${payment.alias || payment.id || index}`} className="rounded-lg bg-brand-surface p-3">
                <p className="font-bold text-brand-navy">{payment.name || payment.alias || "Forma sem nome"}</p>
                <p className="mt-1 text-xs text-slate-600">
                  Alias: {payment.alias || "-"} | Ativa: {payment.active_config === null ? "N/I" : payment.active_config ? "sim" : "nao"}
                </p>
              </li>
            ))}
          </ResultBlock>
          <ResultBlock title="Gateways" count={result.gateways_count}>
            {result.gateways.map((gateway, index) => (
              <li key={`${gateway.alias || gateway.name || index}`} className="rounded-lg bg-brand-surface p-3">
                <p className="font-bold text-brand-navy">{gateway.name || gateway.alias || "Gateway sem nome"}</p>
                <p className="mt-1 text-xs text-slate-600">
                  Alias: {gateway.alias || "-"} | Existe: {gateway.gateway_exists ? "sim" : "nao"}
                </p>
              </li>
            ))}
          </ResultBlock>
        </div>
      ) : null}
    </div>
  );
}

function ResultBlock({
  title,
  count,
  children
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
        {title} ({count})
      </p>
      <ul className="mt-3 space-y-2 text-sm text-slate-700">{count > 0 ? children : <li>Nenhum item retornado.</li>}</ul>
    </div>
  );
}
