-- Marketing types master table
create table if not exists marketing_types (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Seed initial marketing types
insert into marketing_types (name, sort_order) values
  ('카페 바이럴', 1),
  ('블로그 기자단', 2),
  ('블로그 체험단', 3),
  ('인스타그램 바이럴', 4),
  ('유튜브 협찬', 5),
  ('유튜브 채널 운영', 6),
  ('틱톡 바이럴', 7),
  ('네이버 플레이스 관리', 8),
  ('네이버 키워드 광고', 9),
  ('메타 광고', 10),
  ('네이버 쇼핑 최적화', 11),
  ('커뮤니티 바이럴', 12),
  ('문자 마케팅 (SMS)', 13),
  ('포털 뉴스 기사', 14),
  ('온라인 PR', 15),
  ('배포', 16)
on conflict do nothing;

-- Task status enum
create type if not exists task_status as enum (
  'not_started',
  'in_progress',
  'done_settled',
  'done_unsettled'
);

-- Tasks table
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  received_amount bigint not null default 0,
  execution_cost bigint not null default 0,
  profit bigint generated always as (received_amount - execution_cost) stored,
  status task_status not null default 'not_started',
  start_date date not null,
  end_date date,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Task-marketing mapping
create table if not exists task_marketings (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  marketing_type_id uuid references marketing_types(id),
  count int not null default 1,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_tasks_status on tasks(status);
create index if not exists idx_tasks_start_date on tasks(start_date desc);
create index if not exists idx_task_marketings_task_id on task_marketings(task_id);
create index if not exists idx_task_marketings_type_id on task_marketings(marketing_type_id);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on tasks
  for each row execute function update_updated_at();

-- RLS
alter table tasks enable row level security;
alter table task_marketings enable row level security;
alter table marketing_types enable row level security;

-- Allow all authenticated users full access
create policy "authenticated full access" on tasks
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on task_marketings
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on marketing_types
  for all to authenticated using (true) with check (true);
