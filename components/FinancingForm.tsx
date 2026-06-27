"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type InitialData = {
  loja: string;
  loja_id: string;
  produto: string;
  valor: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  cep: string;
};

type FormState = {
  loja_nome: string;
  loja_id: string;
  produto: string;
  valor: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  cep: string;
  data_nascimento: string;
  renda_mensal: string;
  profissao: string;
  entrada: string;
  parcelas: string;
  aceite_termos: boolean;
};

type FinancingFormProps = {
  initialData: InitialData;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const requiredFields: Array<keyof FormState> = [
  "nome",
  "cpf",
  "email",
  "telefone",
  "valor",
  "renda_mensal",
  "parcelas"
];

function parseCurrencyInput(value: string) {
  if (!value) {
    return "";
  }

  return value.replace(/\./g, "").replace(",", ".");
}

function formatMoney(value: string) {
  const numeric = Number(parseCurrencyInput(value));

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "";
  }

  return numeric.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function validateForm(form: FormState) {
  const errors: FormErrors = {};

  requiredFields.forEach((field) => {
    if (!String(form[field]).trim()) {
      errors[field] = "Campo obrigatorio";
    }
  });

  if (!form.aceite_termos) {
    errors.aceite_termos = "E necessario aceitar os termos";
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Informe um e-mail valido";
  }

  if (form.valor && Number(parseCurrencyInput(form.valor)) <= 0) {
    errors.valor = "Informe um valor valido";
  }

  if (form.renda_mensal && Number(parseCurrencyInput(form.renda_mensal)) <= 0) {
    errors.renda_mensal = "Informe uma renda valida";
  }

  return errors;
}

export function FinancingForm({ initialData }: FinancingFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    loja_nome: initialData.loja,
    loja_id: initialData.loja_id,
    produto: initialData.produto,
    valor: initialData.valor,
    nome: initialData.nome,
    cpf: initialData.cpf,
    email: initialData.email,
    telefone: initialData.telefone,
    cep: initialData.cep,
    data_nascimento: "",
    renda_mensal: "",
    profissao: "",
    entrada: "",
    parcelas: "",
    aceite_termos: false
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const purchaseTotal = useMemo(() => formatMoney(form.valor), [form.valor]);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");

    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/propostas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...form,
          valor: Number(parseCurrencyInput(form.valor)),
          renda_mensal: Number(parseCurrencyInput(form.renda_mensal)),
          entrada: form.entrada ? Number(parseCurrencyInput(form.entrada)) : null,
          parcelas: Number(form.parcelas)
        })
      });

      const result = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Nao foi possivel enviar a proposta.");
      }

      router.push("/analise?proposta=criada");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Nao foi possivel enviar a proposta.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <aside className="h-fit rounded-xl border border-brand-line bg-white p-5 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-blue">Resumo da compra</p>
        <div className="mt-5 space-y-4">
          <SummaryItem label="Loja" value={form.loja_nome || "Loja nao informada"} />
          <SummaryItem label="Produto" value={form.produto || "Produto nao informado"} />
          <SummaryItem label="Valor da compra" value={purchaseTotal || "Valor nao informado"} highlight />
        </div>
        <div className="mt-6 rounded-lg bg-brand-surface p-4 text-sm leading-6 text-slate-600">
          A simulacao nao garante aprovacao. Os dados serao usados somente para analise de credito.
        </div>
      </aside>

      <form onSubmit={handleSubmit} className="rounded-xl border border-brand-line bg-white p-5 shadow-soft sm:p-7">
        <div className="flex flex-col gap-3 border-b border-brand-line pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-blue">Formulario</p>
            <h2 className="mt-2 text-2xl font-bold text-brand-navy">Dados para simulacao</h2>
          </div>
          <p className="text-sm text-slate-500">Campos com validacao obrigatoria</p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label="Nome completo" error={errors.nome}>
            <input className="field-input" value={form.nome} onChange={(event) => updateField("nome", event.target.value)} placeholder="Joao Silva" />
          </Field>

          <Field label="CPF" error={errors.cpf}>
            <input className="field-input" value={form.cpf} onChange={(event) => updateField("cpf", event.target.value)} placeholder="00000000000" inputMode="numeric" />
          </Field>

          <Field label="E-mail" error={errors.email}>
            <input className="field-input" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="voce@email.com" type="email" />
          </Field>

          <Field label="Telefone" error={errors.telefone}>
            <input className="field-input" value={form.telefone} onChange={(event) => updateField("telefone", event.target.value)} placeholder="35999999999" inputMode="tel" />
          </Field>

          <Field label="CEP" error={errors.cep}>
            <input className="field-input" value={form.cep} onChange={(event) => updateField("cep", event.target.value)} placeholder="37700000" inputMode="numeric" />
          </Field>

          <Field label="Data de nascimento" error={errors.data_nascimento}>
            <input className="field-input" value={form.data_nascimento} onChange={(event) => updateField("data_nascimento", event.target.value)} type="date" />
          </Field>

          <Field label="Valor da compra" error={errors.valor}>
            <input className="field-input" value={form.valor} onChange={(event) => updateField("valor", event.target.value)} placeholder="2500" inputMode="decimal" />
          </Field>

          <Field label="Renda mensal" error={errors.renda_mensal}>
            <input className="field-input" value={form.renda_mensal} onChange={(event) => updateField("renda_mensal", event.target.value)} placeholder="4500" inputMode="decimal" />
          </Field>

          <Field label="Profissao" error={errors.profissao}>
            <input className="field-input" value={form.profissao} onChange={(event) => updateField("profissao", event.target.value)} placeholder="Analista financeiro" />
          </Field>

          <Field label="Valor de entrada" error={errors.entrada}>
            <input className="field-input" value={form.entrada} onChange={(event) => updateField("entrada", event.target.value)} placeholder="500" inputMode="decimal" />
          </Field>

          <Field label="Quantidade de parcelas desejada" error={errors.parcelas}>
            <select className="field-input" value={form.parcelas} onChange={(event) => updateField("parcelas", event.target.value)}>
              <option value="">Selecione</option>
              <option value="3">3 parcelas</option>
              <option value="6">6 parcelas</option>
              <option value="9">9 parcelas</option>
              <option value="12">12 parcelas</option>
              <option value="18">18 parcelas</option>
              <option value="24">24 parcelas</option>
            </select>
          </Field>

          <Field label="Loja" error={errors.loja_nome}>
            <input className="field-input" value={form.loja_nome} onChange={(event) => updateField("loja_nome", event.target.value)} placeholder="Loja Teste" />
          </Field>

          <Field label="Produto" error={errors.produto}>
            <input className="field-input" value={form.produto} onChange={(event) => updateField("produto", event.target.value)} placeholder="Notebook" />
          </Field>

          <input type="hidden" value={form.loja_id} />
        </div>

        <label className="mt-6 flex gap-3 rounded-lg border border-brand-line bg-brand-surface p-4 text-sm leading-6 text-slate-700">
          <input
            type="checkbox"
            checked={form.aceite_termos}
            onChange={(event) => updateField("aceite_termos", event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-green focus:ring-brand-green"
          />
          <span>
            Autorizo a Kombuy e seus parceiros a realizarem a analise de credito com base nos dados informados.
            {errors.aceite_termos ? <span className="field-error block">{errors.aceite_termos}</span> : null}
          </span>
        </label>

        {submitError ? (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {submitError}
          </div>
        ) : null}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">Status inicial da proposta: nova</p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-green px-6 py-3 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "Enviando..." : "Simular financiamento"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}

function SummaryItem({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={highlight ? "mt-1 text-2xl font-black text-brand-green" : "mt-1 text-base font-semibold text-brand-navy"}>
        {value}
      </p>
    </div>
  );
}
