-- Storage RLS policies for expense-attachments bucket.
-- The bucket is private; authenticated users need explicit policies to upload/read/delete.
create policy "authenticated can upload expense attachments"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'expense-attachments');

create policy "authenticated can read expense attachments"
  on storage.objects for select to authenticated
  using (bucket_id = 'expense-attachments');

create policy "authenticated can delete expense attachments"
  on storage.objects for delete to authenticated
  using (bucket_id = 'expense-attachments');
