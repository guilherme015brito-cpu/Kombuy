import { createClient } from "@supabase/supabase-js";
import type { Proposal } from "@/lib/supabase";

export type { Proposal };

export type YampiInstallation = {
  id: string;
  loja_id: string | null;
  loja_nome: string | null;
  merchant_alias: string | null;
  scope: string | null;
  token_expires_at: string | null;
  refresh_token_expires_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export function hasSupabaseAdminConfig() {
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}
