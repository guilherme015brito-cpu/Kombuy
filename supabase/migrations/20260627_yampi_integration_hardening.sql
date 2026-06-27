create extension if not exists pgcrypto;

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

update public.yampi_instalacoes
set merchant_alias = coalesce(nullif(merchant_alias, ''), nullif(loja_id, ''))
where merchant_alias is null or merchant_alias = '';

update public.yampi_instalacoes
set merchant_id = coalesce(nullif(merchant_id, ''), nullif(loja_id, ''))
where merchant_id is null or merchant_id = '';

do $$
begin
  if not exists (
    select 1
    from public.yampi_instalacoes
    where merchant_alias is not null
    group by merchant_alias
    having count(*) > 1
  ) then
    create unique index if not exists yampi_instalacoes_merchant_alias_unique_idx
    on public.yampi_instalacoes (merchant_alias)
    where merchant_alias is not null;
  end if;
end;
$$;

create index if not exists yampi_instalacoes_created_at_idx on public.yampi_instalacoes (created_at desc);
create index if not exists yampi_instalacoes_status_idx on public.yampi_instalacoes (status);
create index if not exists yampi_instalacoes_loja_id_idx on public.yampi_instalacoes (loja_id);
create index if not exists yampi_instalacoes_merchant_id_idx on public.yampi_instalacoes (merchant_id);

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

do $$
begin
  if not exists (
    select 1
    from public.yampi_webhook_logs
    where event_id is not null
    group by event_id
    having count(*) > 1
  ) then
    create unique index if not exists yampi_webhook_logs_event_id_unique_idx
    on public.yampi_webhook_logs (event_id)
    where event_id is not null;
  end if;
end;
$$;

create index if not exists yampi_webhook_logs_created_at_idx on public.yampi_webhook_logs (created_at desc);
create index if not exists yampi_webhook_logs_evento_idx on public.yampi_webhook_logs (evento);

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
alter table public.propostas add column if not exists updated_at timestamptz default now();

update public.propostas
set origem = case when merchant_alias is not null and merchant_alias <> '' then 'yampi' else coalesce(origem, 'direto') end
where origem is null;

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

alter table public.propostas enable row level security;
alter table public.yampi_instalacoes enable row level security;
alter table public.yampi_webhook_logs enable row level security;

drop policy if exists "No anonymous select propostas" on public.propostas;
drop policy if exists "No anonymous select yampi_instalacoes" on public.yampi_instalacoes;
drop policy if exists "No anonymous select yampi_webhook_logs" on public.yampi_webhook_logs;
