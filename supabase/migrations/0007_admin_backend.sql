-- VELRIX Admin Backend — database-fundament
-- Uitvoeren NA 0001 t/m 0006, via Supabase SQL Editor.
--
-- Uitsluitend additief: geen enkele bestaande tabel, kolom, rij of RLS-
-- policy wordt gewijzigd of verwijderd. customers/services/appointments/
-- ai_settings/invoices/custom_field_definitions blijven volledig
-- ongewijzigd.

-- ---------------------------------------------------------------------
-- 1. industries (Branches)
-- ---------------------------------------------------------------------
create table if not exists industries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table industries enable row level security;

create policy "industries_admin_only"
  on industries for all
  using (is_velrix_admin())
  with check (is_velrix_admin());

-- ---------------------------------------------------------------------
-- 2. custom_field_templates + custom_field_template_fields
-- ---------------------------------------------------------------------
create table if not exists custom_field_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry_id uuid references industries(id),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table custom_field_templates enable row level security;

create policy "custom_field_templates_admin_only"
  on custom_field_templates for all
  using (is_velrix_admin())
  with check (is_velrix_admin());

create table if not exists custom_field_template_fields (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references custom_field_templates(id) on delete cascade,
  field_key text not null,
  label text not null,
  data_type text not null check (data_type in ('text', 'number', 'boolean', 'date', 'select', 'multiselect')),
  required boolean not null default false,
  options jsonb,
  validation jsonb,
  sort_order integer not null default 0,
  visible boolean not null default true,
  unique (template_id, field_key)
);

alter table custom_field_template_fields enable row level security;

create policy "custom_field_template_fields_admin_only"
  on custom_field_template_fields for all
  using (is_velrix_admin())
  with check (is_velrix_admin());

-- ---------------------------------------------------------------------
-- 3. subscriptions (Abonnementen)
-- ---------------------------------------------------------------------
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  plan_name text not null,
  status text not null default 'actief' check (status in ('actief', 'gepauzeerd', 'opgezegd')),
  started_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

alter table subscriptions enable row level security;

create policy "subscriptions_admin_only"
  on subscriptions for all
  using (is_velrix_admin())
  with check (is_velrix_admin());

-- ---------------------------------------------------------------------
-- 4. organizations uitbreiden: industry_id + status
-- ---------------------------------------------------------------------
-- industry_id (nieuw, naast de bestaande vrije-tekst industry-kolom —
-- die blijft gewoon bestaan, wordt niet verwijderd of hernoemd).
alter table organizations add column if not exists industry_id uuid references industries(id);

-- status: bewust met default 'concept' (de veiligste, meest beperkende
-- default — een organisatie die er per ongeluk zonder expliciete status
-- bij komt, is dan NIET bruikbaar in plaats van per ongeluk wél). Nieuwe
-- organisaties krijgen dit automatisch; de UPDATE hieronder direct erna
-- zet ALLE organisaties die nu al bestaan (dus vóór dit veld bestond)
-- expliciet op 'actief' — eenmalig, raakt nooit organisaties die later
-- via de admin-API worden aangemaakt (die krijgen expliciet 'concept'
-- van de API zelf, ongeacht deze backfill).
alter table organizations add column if not exists status text not null default 'concept' check (status in ('concept', 'actief', 'gepauzeerd'));
update organizations set status = 'actief' where status = 'concept';

-- ---------------------------------------------------------------------
-- 5. Seed: de automotive-branche, en koppel bestaande organisaties met
--    industry = 'automotive' (vrije tekst) aan deze nieuwe, beheerbare
--    industries-rij. Geen dataverlies: de oude industry-kolom blijft
--    ongewijzigd staan naast de nieuwe industry_id.
-- ---------------------------------------------------------------------
insert into industries (name, slug, description)
values ('Automotive', 'automotive', 'Garages en autobedrijven')
on conflict (slug) do nothing;

update organizations o
set industry_id = i.id
from industries i
where i.slug = 'automotive'
  and o.industry = 'automotive'
  and o.industry_id is null;
