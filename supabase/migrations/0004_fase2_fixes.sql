-- VELRIX klantportaal — Fase 2 reparaties + garage-features
-- Uitvoeren NA 0001, 0002 en 0003, via Supabase SQL Editor.

-- ---------------------------------------------------------------------
-- 1. BACKFILL: bedrijfsprofiel dat "verdwenen" leek
-- ---------------------------------------------------------------------
-- Oorzaak (zie diagnose): Fase 1 sloeg bedrijfsnaam/adres/openingstijden
-- op in ai_settings. Fase 2 introduceerde de NIEUWE organization_settings
-- -tabel voor exact dezelfde info, maar zonder de bestaande data over te
-- zetten — dus de nieuwe "Bedrijfsprofiel"-pagina las een lege tabel,
-- terwijl de oude data nog gewoon in ai_settings stond. Dit zet 'm over,
-- alleen voor organisaties die nog geen eigen organization_settings-rij
-- hebben (dus zonder iets te overschrijven als je al iets had ingevuld
-- via de nieuwe pagina).
insert into organization_settings (organization_id, bedrijfsnaam, adres, openingstijden)
select a.organization_id, a.bedrijfsnaam, a.adres, a.openingstijden
from ai_settings a
where a.organization_id not in (select organization_id from organization_settings)
  and (a.bedrijfsnaam is not null or a.adres is not null or a.openingstijden != '{}'::jsonb);

-- ---------------------------------------------------------------------
-- 2. customers uitbreiden voor garagegebruik
-- ---------------------------------------------------------------------
-- "naam" blijft bestaan en verplicht (de publieke boekingsflow schrijft
-- hier nog steeds naar via api/_dashboardSync.js — NIET aangeraakt).
-- Onderstaande kolommen zijn nieuw, voor door de garage zelf toegevoegde
-- klanten.
alter table customers add column if not exists voornaam text;
alter table customers add column if not exists achternaam text;
alter table customers add column if not exists kenteken text;
alter table customers add column if not exists voertuig_merk text;
alter table customers add column if not exists voertuig_model text;
alter table customers add column if not exists bouwjaar integer;
alter table customers add column if not exists notities text;

-- ---------------------------------------------------------------------
-- 3. appointments uitbreiden voor garagegebruik
-- ---------------------------------------------------------------------
alter table appointments add column if not exists eindtijd text;
alter table appointments add column if not exists notities text;

-- Bestaande statuswaarden ('bevestigd','geannuleerd','voltooid') blijven
-- geldig — de publieke boekingsflow schrijft nog steeds 'bevestigd' via
-- api/_booking.js en dat blijft ongewijzigd werken. 'gepland' en
-- 'in_behandeling' zijn nieuw, voor garage-eigen gebruik.
alter table appointments drop constraint if exists appointments_status_check;
alter table appointments add constraint appointments_status_check
  check (status in ('gepland', 'bevestigd', 'in_behandeling', 'voltooid', 'geannuleerd'));

-- ---------------------------------------------------------------------
-- 4. invoices — VELRIX -> Garage (niet garage -> hun eigen klanten)
-- ---------------------------------------------------------------------
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  invoice_number text not null,
  issue_date date not null default current_date,
  due_date date,
  description text,
  subtotal numeric(10,2),
  tax numeric(10,2),
  total numeric(10,2) not null,
  currency text not null default 'EUR',
  status text not null default 'openstaand' check (status in ('openstaand', 'betaald', 'verlopen')),
  pdf_url text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table invoices enable row level security;

-- Garages mogen hun eigen facturen uitsluitend LEZEN — het aanmaken van
-- facturen is een VELRIX-interne (admin-only) handeling, geen garage-
-- zelfbedieningsfunctie, dus geen "for all" policy hier.
create policy "invoices_select_own_org_or_admin"
  on invoices for select
  using (organization_id in (select user_organization_ids()) or is_velrix_admin());

create policy "invoices_modify_admin_only"
  on invoices for insert
  with check (is_velrix_admin());

create policy "invoices_update_admin_only"
  on invoices for update
  using (is_velrix_admin())
  with check (is_velrix_admin());

create policy "invoices_delete_admin_only"
  on invoices for delete
  using (is_velrix_admin());
