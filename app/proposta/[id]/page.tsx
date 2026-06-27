import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { getSafeReturnUrl } from "@/lib/return-url";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { Proposal } from "@/lib/supabase";

type ProposalPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getStatusMessage(status: string | null) {
  switch (status) {
    case "enviada_para_analise":
    case "em_analise":
      return "Sua proposta esta em analise. Avisaremos quando houver atualizacao.";
    case "ofertas_disponiveis":
      return "Existem ofertas disponiveis para revisao. A exibicao detalhada sera habilitada em uma etapa futura.";
    case "credito_recusado":
      return "Nao foi possivel aprovar a proposta neste momento.";
    case "cancelada":
      return "Esta proposta foi cancelada.";
    case "erro":
      return "Houve uma falha no processamento. A equipe Kombuy pode revisar a solicitacao.";
    default:
      return "Proposta recebida. Estamos aguardando os dados e a proxima etapa de analise.";
  }
}

export default async function ProposalPage({ params }: ProposalPageProps) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    notFound();
  }

  const { data } = await supabase.from("propostas").select("*").eq("id", id).maybeSingle();

  if (!data) {
    notFound();
  }

  const proposal = data as Proposal;
  const safeReturnUrl = getSafeReturnUrl(proposal.return_url);

  return (
    <main className="page-shell min-h-screen px-4 py-10">
      <section className="mx-auto w-full max-w-2xl rounded-xl border border-brand-line bg-white p-6 shadow-soft sm:p-10">
        <BrandMark />
        <div className="mt-10 rounded-lg bg-brand-surface p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Numero da proposta</p>
          <h1 className="mt-2 break-all text-2xl font-black text-brand-navy">{proposal.id}</h1>
        </div>

        <div className="mt-6">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-blue">Status</p>
          <h2 className="mt-2 text-3xl font-bold text-brand-navy">
            {proposal.financing_status === "em_analise" ? "Em analise" : "Proposta recebida"}
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-600">{getStatusMessage(proposal.financing_status)}</p>
        </div>

        <div className="mt-6 rounded-lg border border-brand-line p-4">
          <p className="text-sm font-bold text-brand-navy">Ofertas disponiveis</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Nenhuma oferta real foi retornada por um provedor de credito ainda. A Kombuy nao simula bancos, taxas ou aprovacao.
          </p>
        </div>

        {safeReturnUrl ? (
          <Link
            href={safeReturnUrl}
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-green px-6 py-3 text-sm font-bold text-white transition hover:bg-green-700"
          >
            Voltar ao checkout
          </Link>
        ) : null}
      </section>
    </main>
  );
}
