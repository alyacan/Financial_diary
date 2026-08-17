-- Bildirimler modülü: push abonelikleri, fiyat alarmları, günlük hatırlatma günlüğü,
-- ve kullanıcı planları (free/pro). Supabase SQL Editor'da ya da
-- `node scripts/run-schema.mjs supabase/schema_notifications.sql` ile çalıştırılır.

-- Kullanıcı planı: push bildirimleri ve fiyat alarmı özelliği yalnızca 'pro'
-- işaretli hesaplara açık. Kimse kendi planını kendi değiştiremez (insert/update
-- policy'si yok) — yalnızca service-role (admin API route'ları) değiştirebilir.
create table public.user_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  -- Yönetici (admin panel) yetkisi 'pro' plandan tamamen bağımsızdır: pro yalnızca
  -- ücretli özellik erişimi (bildirim/fiyat alarmı) sağlar, is_admin ise kullanıcı
  -- yönetimi API'lerine erişim sağlar. Bkz. src/lib/adminAuth.ts.
  is_admin boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.user_plans enable row level security;
create policy "own user_plans select" on public.user_plans
  for select using (auth.uid() = user_id);

-- Yeni kayıt olan her kullanıcı otomatik 'free' planla başlar.
create function public.handle_new_user_plan()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_plans (user_id, plan) values (new.id, 'free');
  return new;
end;
$$;

create trigger on_auth_user_created_plan
  after insert on auth.users
  for each row execute function public.handle_new_user_plan();

create table public.push_subscriptions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
create policy "own push_subscriptions select" on public.push_subscriptions
  for select using (auth.uid() = user_id);
create policy "own push_subscriptions delete" on public.push_subscriptions
  for delete using (auth.uid() = user_id);
-- Sadece pro hesap abonelik ekleyebilir/güncelleyebilir.
create policy "pro push_subscriptions insert" on public.push_subscriptions
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.user_plans where user_id = auth.uid() and plan = 'pro')
  );
create policy "pro push_subscriptions update" on public.push_subscriptions
  for update using (
    auth.uid() = user_id
    and exists (select 1 from public.user_plans where user_id = auth.uid() and plan = 'pro')
  );

create table public.price_alerts (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  asset text not null,
  condition text not null check (condition in ('gte', 'lte')),
  target_price numeric not null,
  triggered_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.price_alerts enable row level security;
create policy "own price_alerts select" on public.price_alerts
  for select using (auth.uid() = user_id);
create policy "own price_alerts delete" on public.price_alerts
  for delete using (auth.uid() = user_id);
-- Sadece pro hesap alarm ekleyebilir.
create policy "pro price_alerts insert" on public.price_alerts
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.user_plans where user_id = auth.uid() and plan = 'pro')
  );

-- Aynı gün aynı saatte (13:00/17:00/21:00) birden fazla kez hatırlatma göndermemek için.
-- Sadece service-role erişir; hiçbir kullanıcıya policy verilmez (RLS açık, policy yok = varsayılan red).
create table public.daily_reminder_log (
  reminder_date date not null,
  slot text not null check (slot in ('13:00', '17:00', '21:00')),
  sent_at timestamptz not null default now(),
  primary key (reminder_date, slot)
);
alter table public.daily_reminder_log enable row level security;

-- Bu şema daha önce '21:00' slotu olmadan uygulanmış bir ortamda tekrar
-- çalıştırılıyorsa (create table hatasız atlanır), kısıtı burada genişlet:
alter table public.daily_reminder_log drop constraint if exists daily_reminder_log_slot_check;
alter table public.daily_reminder_log add constraint daily_reminder_log_slot_check
  check (slot in ('13:00', '17:00', '21:00'));

-- Mevcut (bu şema uygulanmadan önce kayıt olmuş) kullanıcılar için plan satırlarını
-- geriye dönük oluştur — hepsi varsayılan olarak 'free' ve is_admin=false başlar.
insert into public.user_plans (user_id, plan)
select id, 'free' from auth.users
on conflict (user_id) do nothing;

-- Bu şema daha önce is_admin kolonu olmadan uygulanmış bir ortamda tekrar
-- çalıştırılıyorsa (create table hatasız atlanır), kolonu burada ekle:
alter table public.user_plans add column if not exists is_admin boolean not null default false;

-- Yönetici paneline yalnızca sahibinin (alyanonav@gmail.com) hesabı erişebilsin —
-- 'pro' plan bundan tamamen bağımsız, ayrıca istenirse başka hesaplara verilebilir.
update public.user_plans
set is_admin = true, updated_at = now()
where user_id = (select id from auth.users where email = 'alyanonav@gmail.com');
