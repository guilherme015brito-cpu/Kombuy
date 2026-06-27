import { z } from "zod";

function normalizeDigits(value: unknown) {
  return typeof value === "string" ? value.replace(/\D/g, "") : "";
}

function parseMoney(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : NaN;
  }

  if (typeof value !== "string") {
    return NaN;
  }

  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  return Number(normalized);
}

const optionalText = (max = 255) =>
  z
    .unknown()
    .transform((value) => (typeof value === "string" ? value.trim().slice(0, max) : ""))
    .transform((value) => value || null);

const requiredText = (max = 255) =>
  z
    .unknown()
    .transform((value) => (typeof value === "string" ? value.trim().slice(0, max) : ""))
    .pipe(z.string().min(1, "Campo obrigatorio"));

export const createProposalSchema = z.object({
  loja_id: optionalText(),
  loja_nome: optionalText(),
  merchant_alias: optionalText(),
  checkout_id: optionalText(),
  cart_id: optionalText(),
  order_id: optionalText(),
  return_url: optionalText(1000),
  yampi_customer_id: optionalText(),
  produto: optionalText(),
  valor: z.unknown().transform(parseMoney).pipe(z.number().positive("Valor obrigatorio")),
  nome: requiredText(),
  cpf: z
    .unknown()
    .transform(normalizeDigits)
    .pipe(z.string().min(11, "CPF obrigatorio").max(14, "CPF invalido")),
  email: z
    .unknown()
    .transform((value) => (typeof value === "string" ? value.trim().toLowerCase() : ""))
    .pipe(z.string().email("E-mail invalido")),
  telefone: z
    .unknown()
    .transform(normalizeDigits)
    .pipe(z.string().min(10, "Telefone obrigatorio").max(13, "Telefone invalido")),
  cep: z
    .unknown()
    .transform(normalizeDigits)
    .transform((value) => value || null),
  data_nascimento: optionalText(10),
  renda_mensal: z.unknown().transform(parseMoney).pipe(z.number().positive("Renda mensal obrigatoria")),
  profissao: optionalText(),
  entrada: z
    .unknown()
    .transform((value) => {
      if (value === null || value === undefined || value === "") {
        return null;
      }

      const parsed = parseMoney(value);
      return Number.isFinite(parsed) ? parsed : NaN;
    })
    .pipe(z.number().min(0, "Entrada invalida").nullable()),
  parcelas: z
    .unknown()
    .transform((value) => Number(value))
    .pipe(z.number().int().positive("Parcelas obrigatoria").max(60, "Parcelas invalida")),
  aceite_termos: z.literal(true, {
    message: "Aceite dos termos obrigatorio"
  })
});

export function parseCreateProposal(payload: unknown) {
  const parsed = createProposalSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message || "Dados invalidos."
    };
  }

  return {
    success: true as const,
    data: {
      ...parsed.data,
      origem: parsed.data.merchant_alias ? "yampi" : "direto",
      status: "nova",
      financing_status: "aguardando_dados",
      resposta_hiberbank: null
    }
  };
}
