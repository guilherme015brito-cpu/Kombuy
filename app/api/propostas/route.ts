import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

type ProposalPayload = {
  loja_id?: string;
  loja_nome?: string;
  produto?: string;
  valor?: number | string;
  nome?: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  cep?: string;
  data_nascimento?: string;
  renda_mensal?: number | string;
  profissao?: string;
  entrada?: number | string | null;
  parcelas?: number | string;
  aceite_termos?: boolean;
};

const allowedStatuses = ["nova", "em_analise", "aprovada", "recusada", "cancelada"];

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function validate(payload: ProposalPayload) {
  const errors: string[] = [];
  const valor = numberValue(payload.valor);
  const rendaMensal = numberValue(payload.renda_mensal);
  const parcelas = numberValue(payload.parcelas);

  if (!stringValue(payload.nome)) errors.push("Nome obrigatorio");
  if (!stringValue(payload.cpf)) errors.push("CPF obrigatorio");
  if (!stringValue(payload.email)) errors.push("E-mail obrigatorio");
  if (!stringValue(payload.telefone)) errors.push("Telefone obrigatorio");
  if (!valor || valor <= 0) errors.push("Valor obrigatorio");
  if (!rendaMensal || rendaMensal <= 0) errors.push("Renda mensal obrigatoria");
  if (!parcelas || parcelas <= 0) errors.push("Parcelas obrigatoria");
  if (!payload.aceite_termos) errors.push("Aceite dos termos obrigatorio");

  return {
    errors,
    valor,
    rendaMensal,
    parcelas
  };
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Supabase nao configurado. Verifique as variaveis de ambiente." },
      { status: 500 }
    );
  }

  let payload: ProposalPayload;

  try {
    payload = (await request.json()) as ProposalPayload;
  } catch {
    return NextResponse.json({ success: false, error: "JSON invalido." }, { status: 400 });
  }

  const validation = validate(payload);

  if (validation.errors.length > 0) {
    return NextResponse.json(
      { success: false, error: validation.errors.join(", ") },
      { status: 400 }
    );
  }

  const proposal = {
    loja_id: stringValue(payload.loja_id) || null,
    loja_nome: stringValue(payload.loja_nome) || null,
    produto: stringValue(payload.produto) || null,
    valor: validation.valor,
    nome: stringValue(payload.nome),
    cpf: stringValue(payload.cpf),
    email: stringValue(payload.email),
    telefone: stringValue(payload.telefone),
    cep: stringValue(payload.cep) || null,
    data_nascimento: stringValue(payload.data_nascimento) || null,
    renda_mensal: validation.rendaMensal,
    profissao: stringValue(payload.profissao) || null,
    entrada: numberValue(payload.entrada),
    parcelas: validation.parcelas,
    aceite_termos: Boolean(payload.aceite_termos),
    status: "nova",
    resposta_hiberbank: null
  };

  const { data, error } = await supabase
    .from("propostas")
    .insert(proposal)
    .select("id,status")
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, proposta: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Supabase nao configurado. Verifique as variaveis de ambiente." },
      { status: 500 }
    );
  }

  let payload: { id?: string; status?: string };

  try {
    payload = (await request.json()) as { id?: string; status?: string };
  } catch {
    return NextResponse.json({ success: false, error: "JSON invalido." }, { status: 400 });
  }

  const id = stringValue(payload.id);
  const status = stringValue(payload.status);

  if (!id) {
    return NextResponse.json({ success: false, error: "ID da proposta obrigatorio." }, { status: 400 });
  }

  if (!allowedStatuses.includes(status)) {
    return NextResponse.json({ success: false, error: "Status invalido." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("propostas")
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("id,status")
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, proposta: data });
}
