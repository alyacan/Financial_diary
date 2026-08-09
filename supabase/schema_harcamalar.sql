-- Harcamalar modülü: kartlar, harcamalar, kategori bütçeleri, arşivlenmiş dönemler.
-- Supabase SQL Editor'da çalıştırılır. Her tabloda RLS açık — her kullanıcı
-- yalnızca kendi user_id'sine ait satırları görebilir/değiştirebilir.

create table public.payment_cards (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null,
  card_type text not null check (card_type in ('credit', 'debit', 'cash')),
  card_limit numeric,
  created_at timestamptz not null default now()
);
alter table public.payment_cards enable row level security;
create policy "own payment_cards" on public.payment_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.expenses (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  category text not null,
  amount numeric not null,
  note text,
  card_id text references public.payment_cards(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.expenses enable row level security;
create policy "own expenses" on public.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.category_budgets (
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  monthly_goal numeric not null,
  primary key (user_id, category)
);
alter table public.category_budgets enable row level security;
create policy "own category_budgets" on public.category_budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.archived_periods (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null,
  note text
);
alter table public.archived_periods enable row level security;
create policy "own archived_periods" on public.archived_periods
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.archived_period_expenses (
  id text primary key,
  archived_period_id text not null references public.archived_periods(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  category text not null,
  amount numeric not null,
  note text,
  card_id text
);
alter table public.archived_period_expenses enable row level security;
create policy "own archived_period_expenses" on public.archived_period_expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
