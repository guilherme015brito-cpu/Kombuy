import Link from "next/link";
import { StatusPage } from "@/components/StatusPage";

export default function AnalisePage() {
  return (
    <StatusPage
      eyebrow="Proposta recebida"
      title="Sua solicitacao esta em analise"
      description="Recebemos seus dados e sua proposta foi criada com status inicial nova. Em breve a loja ou a equipe Kombuy podera continuar o atendimento."
      tone="analysis"
    >
      <Link
        href="/simular"
        className="inline-flex items-center justify-center rounded-lg bg-brand-green px-5 py-3 text-sm font-bold text-white transition hover:bg-green-700"
      >
        Fazer nova simulacao
      </Link>
    </StatusPage>
  );
}
