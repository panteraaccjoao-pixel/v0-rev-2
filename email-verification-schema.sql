-- Tabela para códigos de verificação de email
create table if not exists email_verifications (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

-- Índice para busca rápida por email
create index if not exists email_verifications_email_idx on email_verifications(email);

-- Limpa verificações expiradas automaticamente (opcional, via pg_cron ou manualmente)
-- Habilita RLS
alter table email_verifications enable row level security;

-- Apenas o service_role acessa (Next.js server-side)
create policy "service_role_only" on email_verifications
  using (false);
