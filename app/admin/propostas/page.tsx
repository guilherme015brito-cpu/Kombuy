import { BrandMark } from "@/components/BrandMark";
import { ProposalStatusSelect } from "@/components/ProposalStatusSelect";
import { getSupabaseAdmin, type Proposal } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo"
  }).format(new Date(value));
}

function formatCurrency(value: number | null) {
  if (value === null) {
    return "-";
  }

  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    nova: "Nova",
    em_analise: "Em analise",
    aprovada: "Aprovada",
    recusada: "Recusada",
    cancelada: "Cancelada"
  };

  return labels[status] || status;
}

function getProposalMetrics(proposals: Proposal[]) {
  return {
    total: proposals.length,
    nova: proposals.filter((proposal) => proposal.status === "nova").length,
    em_analise: proposals.filter((proposal) => proposal.status === "em_analise").length,
    aprovada: proposals.filter((proposal) => proposal.status === "aprovada").length,
    recusada: proposals.filter((proposal) => proposal.status === "recusada").length
  };
}

async function getProposals() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return {
      proposals: [] as Proposal[],
      error: "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para listar propostas."
    };
  }

  const { data, error } = await supabase
    .from("propostas")
    .select("*")
    .order("created_at", { ascending: false });

  return {
    proposals: (data ?? []) as Proposal[],
    error: error?.message
  };
}

export default async function AdminPropostasPage() {
  const { proposals, error } = await getProposals();
  const metrics = getProposalMetrics(proposals);

  return (
    <main className="page-shell min-h-screen">
      <header className="border-b border-brand-line bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <BrandMark />
          <div className="rounded-lg bg-brand-surface px-4 py-3 text-sm font-semibold text-slate-600">
            {proposals.length} proposta{proposals.length === 1 ? "" : "s"} encontrada{proposals.length === 1 ? "" : "s"}
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-blue">Administrativo</p>
          <h1 className="mt-2 text-3xl font-bold text-brand-navy">Propostas de financiamento</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Listagem inicial sem autenticacao para o MVP. Proteja esta rota antes de usar em producao.
          </p>
        </div>

        {error ? (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            {error}
          </div>
        ) : null}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard label="Total de propostas" value={metrics.total} />
          <MetricCard label="Propostas novas" value={metrics.nova} />
          <MetricCard label="Em analise" value={metrics.em_analise} />
          <MetricCard label="Aprovadas" value={metrics.aprovada} />
          <MetricCard label="Recusadas" value={metrics.recusada} />
        </div>

        <div className="hidden overflow-hidden rounded-xl border border-brand-line bg-white shadow-sm lg:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-brand-navy text-white">
              <tr>
                <Th>Data</Th>
                <Th>Loja</Th>
                <Th>Produto</Th>
                <Th>Valor</Th>
                <Th>Nome</Th>
                <Th>CPF</Th>
                <Th>Telefone</Th>
                <Th>Renda mensal</Th>
                <Th>Parcelas</Th>
                <Th>Status</Th>
                <Th>Alterar</Th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((proposal) => (
                <tr key={proposal.id} className="border-t border-brand-line">
                  <Td>{formatDate(proposal.created_at)}</Td>
                  <Td>{proposal.loja_nome || "-"}</Td>
                  <Td>{proposal.produto || "-"}</Td>
                  <Td>{formatCurrency(proposal.valor)}</Td>
                  <Td>{proposal.nome}</Td>
                  <Td>{proposal.cpf}</Td>
                  <Td>{proposal.telefone || "-"}</Td>
                  <Td>{formatCurrency(proposal.renda_mensal)}</Td>
                  <Td>{proposal.parcelas ?? "-"}</Td>
                  <Td>
                    <StatusBadge status={proposal.status} />
                  </Td>
                  <Td>
                    <ProposalStatusSelect proposalId={proposal.id} initialStatus={proposal.status} />
                  </Td>
                </tr>
              ))}
              {proposals.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-slate-500">
                    Nenhuma proposta encontrada.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 lg:hidden">
          {proposals.map((proposal) => (
            <article key={proposal.id} className="rounded-xl border border-brand-line bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{formatDate(proposal.created_at)}</p>
                  <h2 className="mt-2 text-lg font-bold text-brand-navy">{proposal.nome}</h2>
                </div>
                <StatusBadge status={proposal.status} />
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <MobileItem label="Loja" value={proposal.loja_nome || "-"} />
                <MobileItem label="Produto" value={proposal.produto || "-"} />
                <MobileItem label="Valor" value={formatCurrency(proposal.valor)} />
                <MobileItem label="CPF" value={proposal.cpf} />
                <MobileItem label="Telefone" value={proposal.telefone || "-"} />
                <MobileItem label="Renda mensal" value={formatCurrency(proposal.renda_mensal)} />
                <MobileItem label="Parcelas" value={proposal.parcelas ? `${proposal.parcelas}` : "-"} />
              </dl>
              <div className="mt-5 border-t border-brand-line pt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Alterar status</p>
                <ProposalStatusSelect proposalId={proposal.id} initialStatus={proposal.status} />
              </div>
            </article>
          ))}

          {proposals.length === 0 ? (
            <div className="rounded-xl border border-brand-line bg-white px-4 py-10 text-center text-slate-500">
              Nenhuma proposta encontrada.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-brand-line bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-black text-brand-navy">{value}</p>
    </div>
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
      {getStatusLabel(status)}
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
