-- Запустите целиком в Supabase → SQL Editor → Run
-- (ошибка schema_migrations в логах — это служебная, не мешает этому скрипту)

create table if not exists public.app_settings (
  id text primary key,
  settings jsonb not null default '{}'::jsonb,
  metal_prices jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id, settings, metal_prices)
values ('main', '{}'::jsonb, '[]'::jsonb)
on conflict (id) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_select" on public.app_settings;
drop policy if exists "app_settings_insert" on public.app_settings;
drop policy if exists "app_settings_update" on public.app_settings;

create policy "app_settings_select"
  on public.app_settings for select to anon, authenticated
  using (true);

create policy "app_settings_insert"
  on public.app_settings for insert to anon, authenticated
  with check (true);

create policy "app_settings_update"
  on public.app_settings for update to anon, authenticated
  using (true)
  with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.app_settings to anon, authenticated;
