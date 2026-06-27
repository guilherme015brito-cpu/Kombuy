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
  created_at timestamp with time zone default now()
);

create index if not exists propostas_created_at_idx on public.propostas (created_at desc);
create index if not exists propostas_status_idx on public.propostas (status);

create table if not exists public.yampi_instalacoes (
  id uuid primary key default gen_random_uuid(),
  merchant_id text,
  merchant_name text,
  access_token text not null,
  refresh_token text,
  token_type text,
  scope text,
  expires_at timestamp with time zone,
  token_response jsonb,
  status text default 'conectado',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists yampi_instalacoes_created_at_idx on public.yampi_instalacoes (created_at desc);
create index if not exists yampi_instalacoes_status_idx on public.yampi_instalacoes (status);
create index if not exists yampi_instalacoes_merchant_id_idx on public.yampi_instalacoes (merchant_id);

create table if not exists public.yampi_webhook_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text default 'evento_desconhecido',
  payload jsonb not null,
  headers jsonb,
  received_at timestamp with time zone default now()
);

create index if not exists yampi_webhook_logs_received_at_idx on public.yampi_webhook_logs (received_at desc);
create index if not exists yampi_webhook_logs_event_type_idx on public.yampi_webhook_logs (event_type);
