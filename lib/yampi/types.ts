import "server-only";

export type YampiInstallationRecord = {
  id: string;
  loja_id: string | null;
  loja_nome: string | null;
  merchant_alias: string | null;
  merchant_id: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  refresh_token_expires_at: string | null;
  scope: string | null;
  status: string;
  last_api_check_at: string | null;
  last_api_check_status: number | null;
  last_api_check_message: string | null;
  created_at: string;
  updated_at: string;
};

export type YampiSafePayment = {
  id: string | number | null;
  alias: string | null;
  name: string | null;
  active_config: boolean | null;
  is_credit_card: boolean;
  is_billet: boolean;
  is_pix: boolean;
};

export type YampiSafeGateway = {
  alias: string | null;
  name: string | null;
  gateway_exists: boolean;
};

export class YampiSafeError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "YampiSafeError";
    this.status = status;
  }
}
