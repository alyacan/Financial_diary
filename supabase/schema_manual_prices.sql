-- Yatırımlar formundaki manuel altın/fon fiyatları ve fon metadata'sı (yıllık getiri, risk).

create table public.manual_prices (
  user_id uuid not null references auth.users(id) on delete cascade,
  price_key text not null,
  price numeric not null,
  primary key (user_id, price_key)
);
alter table public.manual_prices enable row level security;
create policy "own manual_prices" on public.manual_prices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.fund_metadata (
  user_id uuid not null references auth.users(id) on delete cascade,
  fund_code text not null,
  annual_return_percent numeric,
  risk_level integer,
  primary key (user_id, fund_code)
);
alter table public.fund_metadata enable row level security;
create policy "own fund_metadata" on public.fund_metadata
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
