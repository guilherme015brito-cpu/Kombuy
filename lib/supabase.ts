import { createClient } from "@supabase/supabase-js";

export type Proposal = {
  id: string;
  loja_id: string | null;
  loja_nome: string | null;
  produto: string | null;
  valor: number | null;
  nome: string;
  cpf: string;
  email: string | null;
  telefone: string | null;
  cep: string | null;
  data_nascimento: string | null;
  renda_mensal: number | null;
  profissao: string | null;
  entrada: number | null;
  parcelas: number | null;
  aceite_termos: boolean;
  status: string;
  resposta_hiberbank: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
  origem: string | null;
  merchant_alias: string | null;
  checkout_id: string | null;
  cart_id: string | null;
  order_id: string | null;
  return_url: string | null;
  yampi_customer_id: string | null;
  external_proposal_id: string | null;
  selected_financial_institution: string | null;
  financing_status: string | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabasePublic() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}
