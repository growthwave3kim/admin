-- Expenses table (manual income/expense entries)
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  amount bigint not null,
  expense_date date not null,
  spender text not null,
  entry_type text not null default 'expense' check (entry_type in ('income', 'expense')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_expenses_expense_date on expenses(expense_date desc);
create index if not exists idx_expenses_spender on expenses(spender);

-- Updated_at trigger
create trigger expenses_updated_at
  before update on expenses
  for each row execute function update_updated_at();

-- RLS
alter table expenses enable row level security;

create policy "authenticated full access" on expenses
  for all to authenticated using (true) with check (true);
