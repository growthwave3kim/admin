-- Members table
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

-- Seed members
insert into members (name) values
  ('김국민'),
  ('김도현'),
  ('김태훈')
on conflict do nothing;

-- Add member_id to tasks
alter table tasks
  add column if not exists member_id uuid references members(id) on delete set null;

create index if not exists idx_tasks_member_id on tasks(member_id);

-- RLS
alter table members enable row level security;

create policy "authenticated full access" on members
  for all to authenticated using (true) with check (true);
