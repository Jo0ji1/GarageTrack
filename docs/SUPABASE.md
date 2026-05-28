# Supabase — guia de integração

> Roteiro para habilitar conta na nuvem com login Google (v1.3). Mantém o app offline-first; sync é opcional.

## 1. Criar projeto

1. https://supabase.com → New Project
2. Anote `Project URL` e `anon public key`
3. Em **Authentication → Providers**, habilite **Google**:
   - Crie OAuth 2.0 Client em https://console.cloud.google.com (tipo Android + Web)
   - Cole `Client ID` e `Client Secret`
   - Adicione redirect: `https://<ref>.supabase.co/auth/v1/callback`

## 2. Schema SQL

Execute no SQL Editor do Supabase:

```sql
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

-- Vehicles
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('car','motorcycle')),
  plate text,
  current_mileage integer not null default 0,
  image_uri text,
  updated_at timestamptz default now()
);

create index vehicles_user_idx on public.vehicles(user_id);

-- Maintenance records
create table public.maintenance_records (
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
  updated_at timestamptz default now()
);

create index records_user_idx on public.maintenance_records(user_id);
create index records_vehicle_idx on public.maintenance_records(vehicle_id);

-- Attachments (URLs para Storage)
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  record_id uuid not null references public.maintenance_records(id) on delete cascade,
  kind text not null check (kind in ('photo','audio')),
  storage_path text not null,
  created_at timestamptz default now()
);
```

## 3. Row-Level Security

```sql
alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.maintenance_records enable row level security;
alter table public.attachments enable row level security;

-- Cada usuário só vê o que é dele
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own vehicles" on public.vehicles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own records" on public.maintenance_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own attachments" on public.attachments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-criar profile no signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

## 4. Storage

Crie um bucket **`attachments`** privado. Política:

```sql
create policy "own files" on storage.objects
  for all using (bucket_id = 'attachments' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'attachments' and auth.uid()::text = (storage.foldername(name))[1]);
```

Caminhos: `attachments/<user_id>/<record_id>/<filename>`.

## 5. Cliente no app (v1.3)

```bash
npm install @supabase/supabase-js
```

```ts
// src/services/supabaseClient.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const SecureStoreAdapter = {
  getItem: (k: string) => SecureStore.getItemAsync(k),
  setItem: (k: string, v: string) => SecureStore.setItemAsync(k, v),
  removeItem: (k: string) => SecureStore.deleteItemAsync(k),
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: SecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

## 6. Login Google

```ts
import * as AuthSession from 'expo-auth-session';
import { supabase } from './supabaseClient';

export async function signInWithGoogle() {
  const redirectTo = AuthSession.makeRedirectUri({ scheme: 'garagetrack' });
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (data?.url) {
    const result = await AuthSession.startAsync({ authUrl: data.url, returnUrl: redirectTo });
    if (result.type === 'success' && result.params['access_token']) {
      await supabase.auth.setSession({
        access_token: result.params['access_token'],
        refresh_token: result.params['refresh_token'],
      });
    }
  }
}
```

Em `app.json` adicione `"scheme": "garagetrack"`.

## 7. Estratégia de sync (offline-first)

1. **Source of truth = SQLite local**.
2. Cada mutação local enfileira um job em `pending_sync` (id, tabela, operação, payload, timestamp).
3. Worker periódico (e ao voltar online): drena fila → aplica no Supabase → marca aplicado.
4. Pull incremental por `updated_at > last_pull`.
5. Conflito: vence o último `updated_at`; conflitos críticos vão para um log auditável.

## 8. Variáveis

`.env` (não commitado):
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=ey...
```

Para produção, configure em **EAS Secrets**:
```powershell
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value ...
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value ...
```
