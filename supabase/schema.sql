create table if not exists app_settings (
  id text primary key default 'main',
  settings jsonb not null default '{}',
  metal_prices jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

insert into app_settings (id, settings, metal_prices)
values ('main', '{}', '[]')
on conflict (id) do nothing;

alter table app_settings enable row level security;

create policy "anon_select" on app_settings for select to anon using (true);
create policy "anon_insert" on app_settings for insert to anon with check (true);
create policy "anon_update" on app_settings for update to anon using (true);
