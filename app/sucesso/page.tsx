import Link from "next/link";
import { StatusPage } from "@/components/StatusPage";

export default function SucessoPage() {
  return (
    <StatusPage
      eyebrow="Financiamento aprovado"
      title="Sua proposta foi aprovada"
      description="Tudo certo por aqui. Esta pagina esta pronta para ser usada quando o fluxo de aprovacao for conectado."
      tone="success"
    >
      <Link
        href="/simular"
        className="inline-flex items-center justify-center rounded-lg bg-brand-green px-5 py-3 text-sm font-bold text-white transition hover:bg-green-700"
      >
        Simular outra compra
      </Link>
    </StatusPage>
  );
}
