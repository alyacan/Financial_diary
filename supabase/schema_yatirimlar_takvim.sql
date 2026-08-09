-- Yatırımlar (transactions), takvim notları, portföy trend geçmişi, temettü kayıtları.
-- Harcamalar modülüyle aynı desen: her tabloda RLS, auth.uid() = user_id.

create table public.transactions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_type text not null,
  sub_type text not null,
  date date not null,
  quantity numeric not null,
  buy_price numeric not null,
  fund_code text,
  fund_category text,
  note text,
  created_at timestamptz not null default now()
);
alter table public.transactions enable row level security;
create policy "own transactions" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.calendar_notes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  text text not null,
  created_at timestamptz not null default now()
);
alter table public.calendar_notes enable row level security;
create policy "own calendar_notes" on public.calendar_notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.portfolio_snapshots (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  value numeric not null,
  primary key (user_id, date)
);
alter table public.portfolio_snapshots enable row level security;
create policy "own portfolio_snapshots" on public.portfolio_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.dividend_entries (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  date date not null,
  amount_per_share numeric,
  created_at timestamptz not null default now()
);
alter table public.dividend_entries enable row level security;
create policy "own dividend_entries" on public.dividend_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
