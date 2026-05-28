-- ============================================================
-- GarageTrack — Schema inicial Supabase (v1.3)
-- Execute no SQL Editor do projeto.
-- ============================================================

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. VEHICLES
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
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
create index if not exists vehicles_user_idx on public.vehicles(user_id);

-- 3. MAINTENANCE RECORDS
create table if not exists public.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
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
create index if not exists records_user_idx on public.maintenance_records(user_id);
create index if not exists records_vehicle_idx on public.maintenance_records(vehicle_id);
create index if not exists records_date_idx on public.maintenance_records(performed_at desc);

-- 4. ATTACHMENTS (referência a Storage)
create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  record_id uuid not null references public.maintenance_records(id) on delete cascade,
  kind text not null check (kind in ('photo','audio')),
  storage_path text not null,
  created_at timestamptz default now()
);
create index if not exists attachments_record_idx on public.attachments(record_id);

-- 5. RLS — Row Level Security
alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.maintenance_records enable row level security;
alter table public.attachments enable row level security;

-- Policies (idempotentes via drop+create)
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own vehicles" on public.vehicles;
create policy "own vehicles" on public.vehicles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own records" on public.maintenance_records;
create policy "own records" on public.maintenance_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own attachments" on public.attachments;
create policy "own attachments" on public.attachments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 6. AUTO-CREATE PROFILE no signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 7. updated_at automático
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists vehicles_touch on public.vehicles;
create trigger vehicles_touch before update on public.vehicles
  for each row execute function public.touch_updated_at();

drop trigger if exists records_touch on public.maintenance_records;
create trigger records_touch before update on public.maintenance_records
  for each row execute function public.touch_updated_at();

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
