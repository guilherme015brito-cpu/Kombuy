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
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabasePublic() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}
