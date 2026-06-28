alter table public.yampi_webhook_logs add column if not exists event_type text;

update public.yampi_webhook_logs
set event_type = coalesce(event_type, evento)
where event_type is null;

create index if not exists yampi_webhook_logs_event_type_idx on public.yampi_webhook_logs (event_type);
