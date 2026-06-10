-- ============================================================
-- GarageTrack — Fix RLS Policies (v1.4.2)
-- 
-- Problema: policies com "for all" estão bloqueando INSERT com erro:
-- "new row violates row-level security policy (USING expression)
-- for table vehicles [42501]"
--
-- Solução: criar policies específicas para cada operação (SELECT,
-- INSERT, UPDATE, DELETE). INSERT só precisa de WITH CHECK, não USING.
-- ============================================================

-- Drop policies antigas (que usavam "for all")
drop policy if exists "own vehicles" on public.vehicles;
drop policy if exists "own records" on public.maintenance_records;
drop policy if exists "own attachments" on public.attachments;

-- ============================================================
-- VEHICLES: policies granulares
-- ============================================================

create policy "vehicles_select" on public.vehicles
  for select using (auth.uid() = user_id);

create policy "vehicles_insert" on public.vehicles
  for insert with check (auth.uid() = user_id);

create policy "vehicles_update" on public.vehicles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "vehicles_delete" on public.vehicles
  for delete using (auth.uid() = user_id);

-- ============================================================
-- MAINTENANCE_RECORDS: policies granulares
-- ============================================================

create policy "records_select" on public.maintenance_records
  for select using (auth.uid() = user_id);

create policy "records_insert" on public.maintenance_records
  for insert with check (auth.uid() = user_id);

create policy "records_update" on public.maintenance_records
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "records_delete" on public.maintenance_records
  for delete using (auth.uid() = user_id);

-- ============================================================
-- ATTACHMENTS: policies granulares
-- ============================================================

create policy "attachments_select" on public.attachments
  for select using (auth.uid() = user_id);

create policy "attachments_insert" on public.attachments
  for insert with check (auth.uid() = user_id);

create policy "attachments_update" on public.attachments
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "attachments_delete" on public.attachments
  for delete using (auth.uid() = user_id);

-- ============================================================
-- Validação: testar se INSERT funciona
-- ============================================================
-- Após rodar esta migration, tente sincronizar no app.
-- O erro [42501] não deve mais aparecer.
