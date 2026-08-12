-- VELRIX klantportaal — Fase 2: configureerbaar per organisatie
-- Uitvoeren NA 0001_init.sql en 0002_admin_role.sql, via Supabase SQL Editor.
--
-- Nieuwe tabellen hergebruiken de bestaande, al-geteste RLS-helpers
-- user_organization_ids() en is_velrix_admin() uit eerdere migraties —
-- geen nieuw beveiligingsmechanisme, hetzelfde bewezen patroon.

-- ---------------------------------------------------------------------
-- 1. organization_settings — bedrijfsprofiel, één rij per organisatie
-- ---------------------------------------------------------------------
create table if not exists organization_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references organizations(id) on delete cascade,
  bedrijfsnaam text,
  logo_url text,
  adres text,
  postcode text,
  plaats text,
  email text,
  openingstijden jsonb not null default '{}'::jsonb, -- { "Maandag": "08:00-17:30", ... }
  tijdzone text not null default 'Europe/Amsterdam',
  updated_at timestamptz not null default now()
);

alter table organization_settings enable row level security;

create policy "organization_settings_all_own_org_or_admin"
  on organization_settings for all
  using (organization_id in (select user_organization_ids()) or is_velrix_admin())
  with check (organization_id in (select user_organization_ids()) or is_velrix_admin());

-- ---------------------------------------------------------------------
-- 2. services — meerdere rijen per organisatie, volledige CRUD
-- ---------------------------------------------------------------------
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  naam text not null,
  beschrijving text,
  prijs numeric(10,2),
  afspraakduur_minuten integer not null default 30,
  actief boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table services enable row level security;

create policy "services_all_own_org_or_admin"
  on services for all
  using (organization_id in (select user_organization_ids()) or is_velrix_admin())
  with check (organization_id in (select user_organization_ids()) or is_velrix_admin());

-- ---------------------------------------------------------------------
-- 3. appointment_settings — één rij per organisatie
-- ---------------------------------------------------------------------
-- BELANGRIJK: deze tabel is voorbereid zodat de bestaande, publieke
-- booking-flow (api/availability.js, api/_googleCalendar.js) hier later
-- uit kan lezen in plaats van de huidige hardcoded BUSINESS_HOURS /
-- MEETING_DURATION_MIN / BUFFER_MIN-constanten. Die daadwerkelijke
-- koppeling wordt in DEZE migratie/commit NIET gemaakt — de booking-flow
-- blijft exact zoals hij nu werkt, ongewijzigd.
create table if not exists appointment_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references organizations(id) on delete cascade,
  beschikbare_dagen int[] not null default '{1,2,3,4,5}', -- 0=zondag .. 6=zaterdag
  openingstijden jsonb not null default '{}'::jsonb, -- { "Maandag": "09:00-17:00", ... } — specifiek voor de booking-flow, los van organization_settings.openingstijden (dat is de algemene, weergegeven bedrijfsinfo)
  standaard_afspraakduur_minuten integer not null default 30,
  buffer_minuten integer not null default 15,
  max_afspraken_per_tijdsblok integer not null default 1,
  updated_at timestamptz not null default now()
);

alter table appointment_settings enable row level security;

create policy "appointment_settings_all_own_org_or_admin"
  on appointment_settings for all
  using (organization_id in (select user_organization_ids()) or is_velrix_admin())
  with check (organization_id in (select user_organization_ids()) or is_velrix_admin());

-- ---------------------------------------------------------------------
-- 4. ai_settings uitbreiden (niet vervangen — bestaande data blijft staan)
-- ---------------------------------------------------------------------
-- bedrijfsnaam/adres/openingstijden/diensten blijven als kolommen bestaan
-- (geen dataverlies) maar worden vanaf nu functioneel niet meer gebruikt
-- door de AI Receptionist-pagina — die informatie hoort nu bij
-- organization_settings en services. Nieuwe kolommen hieronder zijn wél
-- de kolommen die de herbouwde pagina gebruikt.
alter table ai_settings add column if not exists ai_actief boolean not null default false;
alter table ai_settings add column if not exists begroeting text;
alter table ai_settings add column if not exists bedrijfsomschrijving text;
alter table ai_settings add column if not exists toegestane_onderwerpen text;
alter table ai_settings add column if not exists verboden_onderwerpen text;
alter table ai_settings add column if not exists doorverbinden_wanneer text;
