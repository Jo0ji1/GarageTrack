-- ============================================================
-- GarageTrack — Ajuste para v1.3.1
-- IDs locais são strings (ex.: "vehicle-honda", "cat-oil-change"),
-- não UUIDs. Converte colunas afetadas para TEXT.
-- Execute APÓS o schema inicial.
-- ============================================================

-- Como as tabelas de dados ainda estão vazias, dropamos e recriamos
-- (mais simples e seguro). PROFILES é preservado.

drop table if exists public.attachments cascade;
drop table if exists public.maintenance_records cascade;
drop table if exists public.vehicles cascade;

-- VEHICLES (id agora TEXT)
create table public.vehicles (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('car','motorcycle')),
  plate text,
  brand text,
  model text,
  year integer,
  current_mileage integer not null default 0,
  image_uri text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index vehicles_user_idx on public.vehicles(user_id);

-- MAINTENANCE_RECORDS (id e vehicle_id agora TEXT; category_id já era TEXT)
create table public.maintenance_records (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id text not null references public.vehicles(id) on delete cascade,
  category_id text not null,
  title text not null,
  description text,
  mileage integer not null,
  cost_cents integer not null default 0,
  performed_at timestamptz not null,
  workshop_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index records_user_idx on public.maintenance_records(user_id);
create index records_vehicle_idx on public.maintenance_records(vehicle_id);
create index records_date_idx on public.maintenance_records(performed_at desc);

-- ATTACHMENTS (id TEXT; record_id TEXT)
create table public.attachments (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  record_id text not null references public.maintenance_records(id) on delete cascade,
  kind text not null check (kind in ('photo','audio')),
  storage_path text not null,
  created_at timestamptz default now()
);
create index attachments_record_idx on public.attachments(record_id);

-- RLS + policies (precisam ser recriadas pois as tabelas foram dropadas)
alter table public.vehicles enable row level security;
alter table public.maintenance_records enable row level security;
alter table public.attachments enable row level security;

create policy "own vehicles" on public.vehicles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own records" on public.maintenance_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own attachments" on public.attachments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Triggers de updated_at
create trigger vehicles_touch before update on public.vehicles
  for each row execute function public.touch_updated_at();

create trigger records_touch before update on public.maintenance_records
  for each row execute function public.touch_updated_at();
