import { FinancingForm } from "@/components/FinancingForm";
import { BrandMark } from "@/components/BrandMark";

type SearchValue = string | string[] | undefined;

type SimularPageProps = {
  searchParams?: Promise<Record<string, SearchValue>>;
};

function readParam(params: Record<string, SearchValue>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function SimularPage({ searchParams }: SimularPageProps) {
  const params = (await searchParams) ?? {};
  const initialData = {
    loja: readParam(params, "loja"),
    loja_id: readParam(params, "loja_id"),
    produto: readParam(params, "produto"),
    valor: readParam(params, "valor"),
    nome: readParam(params, "nome"),
    cpf: readParam(params, "cpf"),
    email: readParam(params, "email"),
    telefone: readParam(params, "telefone"),
    cep: readParam(params, "cep")
  };

  return (
    <main className="page-shell">
      <section className="border-b border-white/10 bg-brand-navy text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-10">
          <div>
            <BrandMark variant="light" />
            <div className="mt-8 max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-300">
                Credito para sua compra online
              </p>
              <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-5xl">
                Simule seu financiamento de forma simples e segura.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-200">
                Complete seus dados para que a Kombuy envie sua proposta para analise de credito.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/15 bg-white/8 p-5 shadow-soft backdrop-blur lg:w-80">
            <p className="text-sm font-semibold text-slate-200">Compra selecionada</p>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-300">Loja</dt>
                <dd className="mt-1 text-lg font-semibold">{initialData.loja || "Loja parceira"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-300">Produto</dt>
                <dd className="mt-1 text-lg font-semibold">{initialData.produto || "Produto selecionado"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-300">Valor</dt>
                <dd className="mt-1 text-2xl font-bold text-green-300">
                  {initialData.valor ? Number(initialData.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Informe no formulario"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <FinancingForm initialData={initialData} />
      </section>
    </main>
  );
}
