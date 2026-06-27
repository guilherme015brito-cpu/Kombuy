import Link from "next/link";
import { StatusPage } from "@/components/StatusPage";

export default function RecusadoPage() {
  return (
    <StatusPage
      eyebrow="Analise finalizada"
      title="Nao foi possivel aprovar agora"
      description="Esta pagina esta preparada para o retorno de recusas quando a integracao de credito for adicionada ao MVP."
      tone="refused"
    >
      <Link
        href="/simular"
        className="inline-flex items-center justify-center rounded-lg border border-brand-line bg-white px-5 py-3 text-sm font-bold text-brand-navy transition hover:border-brand-blue"
      >
        Voltar para simulacao
      </Link>
    </StatusPage>
  );
}
