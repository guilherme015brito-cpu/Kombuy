import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { getSupabaseAdmin, type YampiInstallation } from "@/lib/supabase-server";
import { getYampiConfig, getYampiMissingEnvMessage } from "@/lib/yampi";

export const dynamic = "force-dynamic";

type SearchValue = string | string[] | undefined;

type YampiAdminPageProps = {
  searchParams?: Promise<Record<string, SearchValue>>;
};

function readParam(params: Record<string, SearchValue>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo"
  }).format(new Date(value));
}

async function getInstallations() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return {
      installations: [] as YampiInstallation[],
      error: "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para listar instalacoes."
    };
  }

  const { data, error } = await supabase
    .from("yampi_instalacoes")
    .select("id,merchant_id,merchant_name,token_type,scope,expires_at,status,created_at,updated_at")
    .order("created_at", { ascending: false });

  return {
    installations: (data ?? []) as YampiInstallation[],
    error: error?.message
  };
}

export default async function YampiAdminPage({ searchParams }: YampiAdminPageProps) {
  const params = (await searchParams) ?? {};
  const status = readParam(params, "status");
  const message = readParam(params, "mensagem");
  const { missing, isConfigured } = getYampiConfig();
  const { installations, error } = await getInstallations();
  const isConnected = installations.some((installation) => installation.status === "conectado");

  return (
    <main className="page-shell min-h-screen">
      <header className="border-b border-brand-line bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <BrandMark />
          <Link
            href="/admin/propostas"
            className="inline-flex items-center justify-center rounded-lg border border-brand-line bg-white px-4 py-3 text-sm font-bold text-brand-navy transition hover:border-brand-blue"
          >
            Ver propostas
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-blue">Integracoes</p>
          <h1 className="mt-2 text-3xl font-bold text-brand-navy">Yampi</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Conecte a Kombuy a uma loja Yampi para preparar o recebimento de pedidos e webhooks.
          </p>
        </div>

        {status ? (
          <div className={status === "conectado" ? "mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800" : "mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800"}>
            {status === "conectado" ? "Yampi conectada com sucesso." : message || "Nao foi possivel concluir a conexao com a Yampi."}
          </div>
        ) : null}

        {!isConfigured ? (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            {getYampiMissingEnvMessage(missing)}
          </div>
        ) : null}

        {error ? (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            {error}
          </div>
        ) : null}

        <div className="mb-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div className="rounded-xl border border-brand-line bg-white p-5 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Status</p>
            <p className="mt-2 text-2xl font-black text-brand-navy">
              {isConnected ? "Conectado" : "Nao conectado"}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {isConnected
                ? "Existe pelo menos uma instalacao ativa salva no Supabase."
                : "Nenhuma instalacao conectada foi encontrada."}
            </p>
          </div>

          {isConfigured ? (
            <Link
              href="/api/yampi/oauth/start"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-green px-6 py-3 text-sm font-bold text-white transition hover:bg-green-700"
            >
              Conectar Yampi
            </Link>
          ) : (
            <span className="inline-flex min-h-12 cursor-not-allowed items-center justify-center rounded-lg bg-slate-400 px-6 py-3 text-sm font-bold text-white">
              Conectar Yampi
            </span>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-brand-line bg-white shadow-sm">
          <div className="border-b border-brand-line px-5 py-4">
            <h2 className="text-lg font-bold text-brand-navy">Instalacoes salvas</h2>
          </div>

          <div className="hidden lg:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-brand-navy text-white">
                <tr>
                  <Th>Data</Th>
                  <Th>Loja</Th>
                  <Th>Merchant ID</Th>
                  <Th>Token</Th>
                  <Th>Expira em</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {installations.map((installation) => (
                  <tr key={installation.id} className="border-t border-brand-line">
                    <Td>{formatDate(installation.created_at)}</Td>
                    <Td>{installation.merchant_name || "-"}</Td>
                    <Td>{installation.merchant_id || "-"}</Td>
                    <Td>{installation.token_type || "Bearer"}</Td>
                    <Td>{formatDate(installation.expires_at)}</Td>
                    <Td>
                      <StatusBadge status={installation.status} />
                    </Td>
                  </tr>
                ))}
                {installations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      Nenhuma instalacao encontrada.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 p-4 lg:hidden">
            {installations.map((installation) => (
              <article key={installation.id} className="rounded-lg border border-brand-line p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{formatDate(installation.created_at)}</p>
                    <h2 className="mt-2 text-lg font-bold text-brand-navy">{installation.merchant_name || "Loja Yampi"}</h2>
                  </div>
                  <StatusBadge status={installation.status} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <MobileItem label="Merchant ID" value={installation.merchant_id || "-"} />
                  <MobileItem label="Token" value={installation.token_type || "Bearer"} />
                  <MobileItem label="Expira em" value={formatDate(installation.expires_at)} />
                </dl>
              </article>
            ))}

            {installations.length === 0 ? (
              <div className="px-4 py-10 text-center text-slate-500">
                Nenhuma instalacao encontrada.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-4 align-top text-slate-700">{children}</td>;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-green">
      {status}
    </span>
  );
}

function MobileItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-800">{value}</dd>
    </div>
  );
}
