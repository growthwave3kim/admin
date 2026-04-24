-- Allow unauthenticated (anon) users to read members list.
-- Required for the login page to display the member selector before authentication.
create policy "public read members" on members
  for select to anon using (true);
