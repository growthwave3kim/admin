-- Restrict hard DELETE to admin users only.
-- Admin check: auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
-- Set via Supabase Dashboard: Authentication > Users > Edit user > Raw user meta data: {"role":"admin"}
--
-- IMPORTANT: Set role='admin' on all operator accounts BEFORE applying this migration,
-- otherwise permanentDelete* operations will return 403 for everyone.

-- tasks
drop policy "authenticated full access" on tasks;
create policy "authenticated read write" on tasks
  for all to authenticated using (true) with check (true);
create policy "admin delete" on tasks
  for delete to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- task_marketings
drop policy "authenticated full access" on task_marketings;
create policy "authenticated read write" on task_marketings
  for all to authenticated using (true) with check (true);
create policy "admin delete" on task_marketings
  for delete to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- marketing_types
drop policy "authenticated full access" on marketing_types;
create policy "authenticated read write" on marketing_types
  for all to authenticated using (true) with check (true);
create policy "admin delete" on marketing_types
  for delete to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- expenses
drop policy "authenticated full access" on expenses;
create policy "authenticated read write" on expenses
  for all to authenticated using (true) with check (true);
create policy "admin delete" on expenses
  for delete to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- clients
drop policy "authenticated full access" on clients;
create policy "authenticated read write" on clients
  for all to authenticated using (true) with check (true);
create policy "admin delete" on clients
  for delete to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- expense_categories
drop policy "authenticated full access" on expense_categories;
create policy "authenticated read write" on expense_categories
  for all to authenticated using (true) with check (true);
create policy "admin delete" on expense_categories
  for delete to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- members
drop policy "authenticated full access" on members;
create policy "authenticated read write" on members
  for all to authenticated using (true) with check (true);
create policy "admin delete" on members
  for delete to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
