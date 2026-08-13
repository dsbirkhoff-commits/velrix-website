-- VELRIX — universele klantstructuur met branche-specifieke custom_fields
-- Uitvoeren NA 0001, 0002, 0003 en 0004, via Supabase SQL Editor.
--
-- STAP A van het implementatieplan: alleen structuur. Stap B (bestaande
-- garagedata migreren) staat in een apart bestand (0006_migrate_garage_data.sql)
-- zodat de structurele wijziging en de datamigratie onafhankelijk
-- controleerbaar zijn, en zodat we tussen beide stappen kunnen verifiëren.

-- ---------------------------------------------------------------------
-- 1. organizations.industry — vrije tekst, bewust geen enum/check-
--    constraint (nieuwe branche toevoegen mag geen migratie vereisen).
--    Geldige waarden worden in de applicatiecode bewaakt, niet hier.
-- ---------------------------------------------------------------------
alter table organizations add column if not exists industry text;

-- ---------------------------------------------------------------------
-- 2. customers.custom_fields — branche-specifieke gegevens
-- ---------------------------------------------------------------------
alter table customers add column if not exists custom_fields jsonb not null default '{}'::jsonb;

-- Generieke index voor containment-zoekopdrachten op willekeurig welk
-- custom field (bv. custom_fields @> '{"kenteken":"12-AB-34"}').
-- Gerichte btree-indexen per specifiek veelgebruikt veld komen later,
-- pas wanneer dat in de praktijk nodig blijkt (zie het technisch ontwerp).
create index if not exists customers_custom_fields_gin_idx on customers using gin (custom_fields);

-- ---------------------------------------------------------------------
-- 3. custom_field_definitions — één tabel, herbruikbaar voor meerdere
--    entiteiten later (customers nu, appointments/leads/services ooit)
-- ---------------------------------------------------------------------
create table if not exists custom_field_definitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  entity_type text not null default 'customer' check (entity_type in ('customer', 'appointment', 'lead', 'service', 'organization')),
  field_key text not null,
  label text not null,
  data_type text not null check (data_type in ('text', 'number', 'boolean', 'date', 'select', 'multiselect')),
  required boolean not null default false,
  options jsonb,
  validation jsonb,
  sort_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, entity_type, field_key)
);

alter table custom_field_definitions enable row level security;

-- Elke organisatie mag haar EIGEN schema lezen (nodig om het klant-
-- formulier correct te renderen) — zelfde bewezen patroon als elke
-- andere tabel in dit project.
create policy "custom_field_definitions_select_own_org_or_admin"
  on custom_field_definitions for select
  using (organization_id in (select user_organization_ids()) or is_velrix_admin());

-- Schrijven (aanmaken/wijzigen/verwijderen van veld-DEFINITIES) is
-- uitsluitend voor VELRIX-admin, expliciet zoals afgesproken — een
-- organisatie mag de WAARDEN van haar custom_fields invullen (via de
-- gewone customers-CRUD), maar niet zelf bepalen welke velden bestaan.
create policy "custom_field_definitions_admin_only_write"
  on custom_field_definitions for insert
  with check (is_velrix_admin());

create policy "custom_field_definitions_admin_only_update"
  on custom_field_definitions for update
  using (is_velrix_admin())
  with check (is_velrix_admin());

create policy "custom_field_definitions_admin_only_delete"
  on custom_field_definitions for delete
  using (is_velrix_admin());
