-- ============================================================
-- GarageTrack — Storage bucket para anexos
-- Execute APÓS criar manualmente o bucket "attachments" como Private.
-- ============================================================

-- Policy: usuários só leem/escrevem em sua própria pasta
-- Path convention: attachments/<user_id>/<record_id>/<filename>

drop policy if exists "own files read" on storage.objects;
create policy "own files read" on storage.objects
  for select using (
    bucket_id = 'attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "own files write" on storage.objects;
create policy "own files write" on storage.objects
  for insert with check (
    bucket_id = 'attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "own files update" on storage.objects;
create policy "own files update" on storage.objects
  for update using (
    bucket_id = 'attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "own files delete" on storage.objects;
create policy "own files delete" on storage.objects
  for delete using (
    bucket_id = 'attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
