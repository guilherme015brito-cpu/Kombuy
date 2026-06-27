create extension if not exists pgcrypto;

create table if not exists public.propostas (
  id uuid primary key default gen_random_uuid(),
  loja_id text,
  loja_nome text,
  produto text,
  valor numeric,
  nome text not null,
  cpf text not null,
  email text,
  telefone text,
  cep text,
  data_nascimento date,
  renda_mensal numeric,
  profissao text,
  entrada numeric,
  parcelas int,
  aceite_termos boolean default false,
  status text default 'nova',
  resposta_hiberbank jsonb,
  origem text default 'direto',
  merchant_alias text,
  checkout_id text,
  cart_id text,
  order_id text,
  return_url text,
  yampi_customer_id text,
  external_proposal_id text,
  selected_financial_institution text,
  financing_status text default 'aguardando_dados',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.propostas add column if not exists loja_id text;
alter table public.propostas add column if not exists loja_nome text;
alter table public.propostas add column if not exists produto text;
alter table public.propostas add column if not exists valor numeric;
alter table public.propostas add column if not exists nome text;
alter table public.propostas add column if not exists cpf text;
alter table public.propostas add column if not exists email text;
alter table public.propostas add column if not exists telefone text;
alter table public.propostas add column if not exists cep text;
alter table public.propostas add column if not exists data_nascimento date;
alter table public.propostas add column if not exists renda_mensal numeric;
alter table public.propostas add column if not exists profissao text;
alter table public.propostas add column if not exists entrada numeric;
alter table public.propostas add column if not exists parcelas int;
alter table public.propostas add column if not exists aceite_termos boolean default false;
alter table public.propostas add column if not exists status text default 'nova';
alter table public.propostas add column if not exists resposta_hiberbank jsonb;
alter table public.propostas add column if not exists origem text default 'direto';
alter table public.propostas add column if not exists merchant_alias text;
alter table public.propostas add column if not exists checkout_id text;
alter table public.propostas add column if not exists cart_id text;
alter table public.propostas add column if not exists order_id text;
alter table public.propostas add column if not exists return_url text;
alter table public.propostas add column if not exists yampi_customer_id text;
alter table public.propostas add column if not exists external_proposal_id text;
alter table public.propostas add column if not exists selected_financial_institution text;
alter table public.propostas add column if not exists financing_status text default 'aguardando_dados';
alter table public.propostas add column if not exists created_at timestamptz default now();
alter table public.propostas add column if not exists updated_at timestamptz default now();

create table if not exists public.yampi_instalacoes (
  id uuid primary key default gen_random_uuid(),
  loja_id text,
  loja_nome text,
  merchant_alias text,
  merchant_id text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  scope text,
  status text default 'ativa',
  last_api_check_at timestamptz,
  last_api_check_status integer,
  last_api_check_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.yampi_instalacoes add column if not exists loja_id text;
alter table public.yampi_instalacoes add column if not exists loja_nome text;
alter table public.yampi_instalacoes add column if not exists merchant_alias text;
alter table public.yampi_instalacoes add column if not exists merchant_id text;
alter table public.yampi_instalacoes add column if not exists access_token text;
alter table public.yampi_instalacoes add column if not exists refresh_token text;
alter table public.yampi_instalacoes add column if not exists token_expires_at timestamptz;
alter table public.yampi_instalacoes add column if not exists refresh_token_expires_at timestamptz;
alter table public.yampi_instalacoes add column if not exists scope text;
alter table public.yampi_instalacoes add column if not exists status text default 'ativa';
alter table public.yampi_instalacoes add column if not exists last_api_check_at timestamptz;
alter table public.yampi_instalacoes add column if not exists last_api_check_status integer;
alter table public.yampi_instalacoes add column if not exists last_api_check_message text;
alter table public.yampi_instalacoes add column if not exists created_at timestamptz default now();
alter table public.yampi_instalacoes add column if not exists updated_at timestamptz default now();

create table if not exists public.yampi_webhook_logs (
  id uuid primary key default gen_random_uuid(),
  loja_id text,
  evento text,
  event_id text,
  payload jsonb,
  headers jsonb,
  created_at timestamptz default now()
);

alter table public.yampi_webhook_logs add column if not exists loja_id text;
alter table public.yampi_webhook_logs add column if not exists evento text;
alter table public.yampi_webhook_logs add column if not exists event_id text;
alter table public.yampi_webhook_logs add column if not exists payload jsonb;
alter table public.yampi_webhook_logs add column if not exists headers jsonb;
alter table public.yampi_webhook_logs add column if not exists created_at timestamptz default now();

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists propostas_set_updated_at on public.propostas;
create trigger propostas_set_updated_at
before update on public.propostas
for each row execute function public.set_updated_at();

drop trigger if exists yampi_instalacoes_set_updated_at on public.yampi_instalacoes;
create trigger yampi_instalacoes_set_updated_at
before update on public.yampi_instalacoes
for each row execute function public.set_updated_at();

create index if not exists propostas_created_at_idx on public.propostas (created_at desc);
create index if not exists propostas_status_idx on public.propostas (status);
create index if not exists yampi_instalacoes_created_at_idx on public.yampi_instalacoes (created_at desc);
create index if not exists yampi_instalacoes_status_idx on public.yampi_instalacoes (status);
create index if not exists yampi_instalacoes_loja_id_idx on public.yampi_instalacoes (loja_id);
create index if not exists yampi_instalacoes_merchant_alias_idx on public.yampi_instalacoes (merchant_alias);
create unique index if not exists yampi_instalacoes_merchant_alias_unique_idx on public.yampi_instalacoes (merchant_alias) where merchant_alias is not null;
create index if not exists yampi_webhook_logs_created_at_idx on public.yampi_webhook_logs (created_at desc);
create index if not exists yampi_webhook_logs_evento_idx on public.yampi_webhook_logs (evento);
create unique index if not exists yampi_webhook_logs_event_id_unique_idx on public.yampi_webhook_logs (event_id) where event_id is not null;

alter table public.propostas enable row level security;
alter table public.yampi_instalacoes enable row level security;
alter table public.yampi_webhook_logs enable row level security;
