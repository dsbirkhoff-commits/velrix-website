-- VELRIX — API-keys voor server-to-server integraties (n8n e.a.)
-- Uitvoeren NA 0001 t/m 0008, via Supabase SQL Editor.
--
-- Doel: elke key hoort bij PRECIES ÉÉN organisatie (organization_id
-- NOT NULL) — een geldige key kan structureel nooit aan meerdere
-- organisaties gekoppeld zijn, of aan geen enkele. De ruwe key wordt
-- NERGENS opgeslagen — uitsluitend een SHA-256-hash. Beheer (aanmaken/
-- intrekken) gebeurt in v1 nog via de SQL Editor, geen admin-UI in deze
-- fase (bewust, zie ontwerp).

create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  key_hash text not null unique,
  key_prefix text not null, -- bv. "vlx_live_ab12" — uitsluitend voor herkenning in een toekomstige beheer-UI, nooit de volledige key
  label text,
  created_by uuid references auth.users(id),
  last_used_at timestamptz,
  revoked_at timestamptz, -- null = actief; gezet = onmiddellijk ingetrokken
  created_at timestamptz not null default now()
);

alter table api_keys enable row level security;

-- Uitsluitend VELRIX-admins mogen deze tabel ooit lezen/beheren — zelfde
-- patroon als industries/custom_field_templates/subscriptions. Servercode
-- die een API-key verifieert gebruikt de service-role client (RLS-bypass,
-- zelfde patroon als de rest van dit project), dus deze policy is puur
-- een vangnet, niet het primaire mechanisme.
drop policy if exists "api_keys_admin_only" on api_keys;
create policy "api_keys_admin_only"
  on api_keys for all
  using (is_velrix_admin())
  with check (is_velrix_admin());

create index if not exists api_keys_organization_id_idx on api_keys (organization_id);
