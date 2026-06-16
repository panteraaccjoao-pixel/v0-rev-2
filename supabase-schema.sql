-- ============================================================
-- REV SYSTEM — Schema completo do Supabase
-- Cole este SQL no SQL Editor do Supabase e execute.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. PROFILES (usuários)
-- ────────────────────────────────────────────────────────────
create table if not exists profiles (
  id           text primary key,
  name         text not null default '',
  email        text not null unique,
  password     text,
  balance      numeric(12,2) not null default 0,
  total_spent  numeric(12,2) not null default 0,
  purchases    integer not null default 0,
  status       text not null default 'active' check (status in ('active', 'blocked')),
  discord_id   text default '',
  created_at   timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- 2. STOCK (cartões em estoque)
-- ────────────────────────────────────────────────────────────
create table if not exists stock (
  id           text primary key,
  bin          text not null default '',
  full_card    text not null default '',
  expiry       text not null default '',
  cvv          text not null default '',
  bank         text not null default '',
  type         text not null default 'CREDIT',
  level        text not null default 'Standard',
  price        numeric(10,2) not null default 0,
  brand        text not null default 'visa',
  holder_name  text default '',
  cpf          text default '',
  birth_date   text default '',
  created_at   timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- 3. ORDERS (pedidos entregues)
-- ────────────────────────────────────────────────────────────
create table if not exists orders (
  id         text primary key,
  oder_id    text not null default '',
  user_id    text not null,
  user_name  text not null default 'Cliente',
  product    text not null default '',
  level      text not null default 'Standard',
  brand      text not null default 'visa',
  quantity   integer not null default 1,
  total      numeric(10,2) not null default 0,
  date       timestamptz not null default now(),
  status     text not null default 'entregue'
               check (status in ('entregue', 'expirado', 'reembolsado', 'pendente')),
  card_data  jsonb
);

-- ────────────────────────────────────────────────────────────
-- 4. PIX_PAYMENTS (pagamentos PIX)
-- ────────────────────────────────────────────────────────────
create table if not exists pix_payments (
  id             text primary key,
  amount         numeric(10,2) not null,
  status         text not null default 'pending'
                   check (status in ('pending', 'paid', 'expired')),
  pix_code       text not null default '',
  qr_code_url    text not null default '',
  user_email     text,
  user_id        text,
  user_name      text,
  purpose        text not null default 'recharge'
                   check (purpose in ('recharge', 'purchase')),
  credited       boolean not null default false,
  delivered      boolean not null default false,
  restored       boolean not null default false,
  reserved_cards jsonb not null default '[]',
  coupon_code    text,
  items          jsonb not null default '[]',
  created_at     timestamptz not null default now(),
  expires_at     timestamptz not null default (now() + interval '30 minutes')
);

-- ────────────────────────────────────────────────────────────
-- 5. CUPONS
-- ────────────────────────────────────────────────────────────
create table if not exists cupons (
  id        text primary key,
  code      text not null unique,
  discount  numeric(10,2) not null default 0,
  type      text not null default 'percent' check (type in ('percent', 'fixed')),
  uses      integer not null default 0,
  max_uses  integer,
  status    text not null default 'ativo'
              check (status in ('ativo', 'expirado', 'desativado')),
  expiry    text,
  created_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- 6. SETTINGS (configurações do sistema)
-- ────────────────────────────────────────────────────────────
create table if not exists settings (
  key        text primary key,
  value      jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- 7. LOGINS (log de acessos)
-- ────────────────────────────────────────────────────────────
create table if not exists logins (
  id         text primary key default gen_random_uuid()::text,
  user_id    text,
  email      text,
  ip         text,
  user_agent text,
  success    boolean not null default true,
  created_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- 8. REVIEWS (avaliações)
-- ────────────────────────────────────────────────────────────
create table if not exists reviews (
  id         text primary key,
  user_id    text,
  user_name  text not null default '',
  rating     integer not null default 5 check (rating between 1 and 5),
  comment    text not null default '',
  image_url  text,
  status     text not null default 'pendente'
               check (status in ('pendente', 'aprovado', 'rejeitado')),
  created_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- 9. TICKETS (suporte)
-- ────────────────────────────────────────────────────────────
create table if not exists tickets (
  id         text primary key,
  user_id    text,
  user_name  text not null default '',
  user_email text,
  subject    text not null default '',
  message    text not null default '',
  status     text not null default 'aberto'
               check (status in ('aberto', 'em_andamento', 'fechado')),
  created_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- 10. DROPS (lançamentos limitados)
-- ────────────────────────────────────────────────────────────
create table if not exists drops (
  id          text primary key,
  name        text not null default '',
  description text default '',
  price       numeric(10,2) not null default 0,
  quantity    integer not null default 0,
  sold        integer not null default 0,
  status      text not null default 'ativo'
                check (status in ('ativo', 'encerrado', 'agendado')),
  starts_at   timestamptz,
  created_at  timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- 11. GIFTS (presentes/gift cards)
-- ────────────────────────────────────────────────────────────
create table if not exists gifts (
  id         text primary key,
  code       text not null unique,
  amount     numeric(10,2) not null default 0,
  used       boolean not null default false,
  used_by    text,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- ÍNDICES (performance)
-- ────────────────────────────────────────────────────────────
create index if not exists idx_profiles_email        on profiles (email);
create index if not exists idx_orders_user_id        on orders (user_id);
create index if not exists idx_orders_date           on orders (date desc);
create index if not exists idx_pix_payments_user_id  on pix_payments (user_id);
create index if not exists idx_pix_payments_status   on pix_payments (status);
create index if not exists idx_stock_level_brand     on stock (level, brand);
create index if not exists idx_logins_user_id        on logins (user_id);
create index if not exists idx_logins_created_at     on logins (created_at desc);

-- ────────────────────────────────────────────────────────────
-- FUNÇÕES RPC (operações atômicas)
-- ────────────────────────────────────────────────────────────

-- Incrementa saldo do usuário de forma atômica
create or replace function increment_balance(p_user_id text, p_amount numeric)
returns setof profiles
language sql
as $$
  update profiles
  set balance = balance + p_amount
  where id = p_user_id
  returning *;
$$;

-- Registra compra (incrementa purchases e total_spent — saldo é descontado no checkout)
create or replace function record_purchase(p_user_id text, p_amount numeric)
returns setof profiles
language sql
as $$
  update profiles
  set
    purchases   = purchases + 1,
    total_spent = total_spent + p_amount
  where id = p_user_id
  returning *;
$$;

-- Consome cupom de forma atômica (incrementa uses e expira se atingir max_uses)
create or replace function use_coupon(p_code text)
returns boolean
language plpgsql
as $$
declare
  v_cupom cupons%rowtype;
begin
  select * into v_cupom from cupons where code = upper(p_code) for update;
  if not found then return false; end if;
  if v_cupom.status <> 'ativo' then return false; end if;
  if v_cupom.expiry is not null and v_cupom.expiry::timestamptz < now() then return false; end if;
  if v_cupom.max_uses is not null and v_cupom.uses >= v_cupom.max_uses then return false; end if;

  update cupons
  set
    uses   = uses + 1,
    status = case
               when max_uses is not null and (uses + 1) >= max_uses then 'expirado'
               else status
             end
  where code = upper(p_code);

  return true;
end;
$$;

-- ────────────────────────────────────────────────────────────
-- RLS (Row Level Security) — bloqueio total; só service_role acessa
-- ────────────────────────────────────────────────────────────
alter table profiles     enable row level security;
alter table stock        enable row level security;
alter table orders       enable row level security;
alter table pix_payments enable row level security;
alter table cupons       enable row level security;
alter table settings     enable row level security;
alter table logins       enable row level security;
alter table reviews      enable row level security;
alter table tickets      enable row level security;
alter table drops        enable row level security;
alter table gifts        enable row level security;
