# 🔧 Como aplicar a migration de fix de RLS

## Problema
Erro ao sincronizar: **"new row violates row-level security policy (USING expression) for table vehicles [42501]"**

## Solução
Rodar a migration `20260610000300_fix_rls_policies.sql` no Supabase SQL Editor.

---

## 📋 Passo a passo

### 1. Acesse o Supabase SQL Editor
1. Abra: https://supabase.com/dashboard/project/odkrgwacwbsebbmwydbs
2. No menu lateral, clique em **SQL Editor**
3. Clique em **New query**

### 2. Cole o conteúdo da migration
Abra o arquivo `supabase/migrations/20260610000300_fix_rls_policies.sql` e copie TODO o conteúdo.

**OU** cole diretamente este SQL:

```sql
-- Drop policies antigas (que usavam "for all")
drop policy if exists "own vehicles" on public.vehicles;
drop policy if exists "own records" on public.maintenance_records;
drop policy if exists "own attachments" on public.attachments;

-- VEHICLES: policies granulares
create policy "vehicles_select" on public.vehicles
  for select using (auth.uid() = user_id);

create policy "vehicles_insert" on public.vehicles
  for insert with check (auth.uid() = user_id);

create policy "vehicles_update" on public.vehicles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "vehicles_delete" on public.vehicles
  for delete using (auth.uid() = user_id);

-- MAINTENANCE_RECORDS: policies granulares
create policy "records_select" on public.maintenance_records
  for select using (auth.uid() = user_id);

create policy "records_insert" on public.maintenance_records
  for insert with check (auth.uid() = user_id);

create policy "records_update" on public.maintenance_records
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "records_delete" on public.maintenance_records
  for delete using (auth.uid() = user_id);

-- ATTACHMENTS: policies granulares
create policy "attachments_select" on public.attachments
  for select using (auth.uid() = user_id);

create policy "attachments_insert" on public.attachments
  for insert with check (auth.uid() = user_id);

create policy "attachments_update" on public.attachments
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "attachments_delete" on public.attachments
  for delete using (auth.uid() = user_id);
```

### 3. Execute
1. Clique no botão **Run** (canto inferior direito)
2. ✅ Deve aparecer: **"Success. No rows returned"**

### 4. Verifique as policies (opcional)
1. Vá em **Database → Policies** no menu lateral
2. Abra a tabela `vehicles`
3. ✅ Deve ter 4 policies:
   - `vehicles_select`
   - `vehicles_insert`
   - `vehicles_update`
   - `vehicles_delete`

---

## 🧪 Teste no app

1. Abra o app no dispositivo secundário
2. Toque em **"Sincronizar agora"**
3. ✅ **Esperado:** Sincronização bem-sucedida, sem erro [42501]
4. ✅ Verifique no Supabase Table Editor → `vehicles` tem o registro

---

## ❓ Se der erro ao rodar a migration

### "permission denied for table vehicles"
**Causa:** Você está logado com uma role sem permissão.  
**Solução:** Certifique-se de estar usando a role `postgres` (seletor no canto superior direito do SQL Editor).

### "policy already exists"
**Causa:** As policies novas já foram criadas.  
**Solução:** Tudo certo, pode fechar! O fix já está aplicado.

### "relation does not exist"
**Causa:** A migration `20260528000200_text_ids.sql` não foi rodada ainda.  
**Solução:** Rode ela primeiro, depois rode esta.

---

## 🔗 Referência
- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- Commit: (será preenchido após push)
