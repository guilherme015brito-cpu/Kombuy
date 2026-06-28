alter table public.yampi_instalacoes add column if not exists webhook_id bigint;
alter table public.yampi_instalacoes add column if not exists webhook_secret text;
alter table public.yampi_instalacoes add column if not exists webhook_url text;
alter table public.yampi_instalacoes add column if not exists webhook_status text default 'pendente';
alter table public.yampi_instalacoes add column if not exists webhook_events jsonb;
alter table public.yampi_instalacoes add column if not exists webhook_created_at timestamptz;
alter table public.yampi_instalacoes add column if not exists webhook_last_received_at timestamptz;
alter table public.yampi_instalacoes add column if not exists webhook_last_event text;
alter table public.yampi_instalacoes add column if not exists webhook_last_error text;

create index if not exists yampi_instalacoes_webhook_id_idx on public.yampi_instalacoes (webhook_id);
create index if not exists yampi_instalacoes_webhook_status_idx on public.yampi_instalacoes (webhook_status);
