-- VELRIX klantportaal — admin-rol + herziene RLS
-- Uitvoeren NA 0001_init.sql, via: Supabase Dashboard -> SQL Editor
--
-- Voegt het onderscheid tussen twee gebruikerstypen toe:
--   1. VELRIX ADMIN   — platform-breed, mag alle organisaties zien/beheren
--   2. KLANT / ORGANIZATION USER — uitsluitend de eigen organisatie
--      (dit was in 0001_init.sql al het enige type; ongewijzigd)
--
-- Dit gebeurt via een aparte profiles-tabel (1 rij per auth.users-rij),
-- NIET door een organisatie zelf als "VELRIX" te markeren — een admin is
-- een gebruikerseigenschap, geen organisatie-eigenschap. Dat betekent ook
-- dat een VELRIX-medewerker geen lid hoeft te zijn van een organisatie om
-- platform-breed toegang te hebben.

-- ---------------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  is_velrix_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Iedereen mag zijn eigen profiel lezen (nodig om te weten of je admin
-- bent). Nooit dat van een ander — dat gaat via de is_velrix_admin()
-- functie hieronder, niet via directe tabeltoegang.
create policy "profiles_select_own"
  on profiles for select
  using (id = auth.uid());

-- ---------------------------------------------------------------------
-- 2. Helperfunctie, zelfde patroon als user_organization_ids() in
--    0001_init.sql: security definer zodat admin-check niet zelf weer
--    door RLS wordt tegengehouden, en geen recursie kan veroorzaken.
-- ---------------------------------------------------------------------
create or replace function is_velrix_admin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce((select p.is_velrix_admin from profiles p where p.id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------
-- 3. Bestaande policies herzien: admins krijgen platform-brede toegang,
--    gewone klant-gebruikers blijven EXACT zo beperkt als in 0001_init.sql
--    (dit voegt alleen een OR is_velrix_admin() toe — de bestaande
--    voorwaarde voor klant-gebruikers wordt niet versoepeld).
-- ---------------------------------------------------------------------

drop policy if exists "organizations_select_own" on organizations;
create policy "organizations_select_own_or_admin"
  on organizations for select
  using (id in (select user_organization_ids()) or is_velrix_admin());

drop policy if exists "memberships_select_same_org" on memberships;
create policy "memberships_select_same_org_or_admin"
  on memberships for select
  using (organization_id in (select user_organization_ids()) or is_velrix_admin());

drop policy if exists "customers_all_own_org" on customers;
create policy "customers_all_own_org_or_admin"
  on customers for all
  using (organization_id in (select user_organization_ids()) or is_velrix_admin())
  with check (organization_id in (select user_organization_ids()) or is_velrix_admin());

drop policy if exists "appointments_all_own_org" on appointments;
create policy "appointments_all_own_org_or_admin"
  on appointments for all
  using (organization_id in (select user_organization_ids()) or is_velrix_admin())
  with check (organization_id in (select user_organization_ids()) or is_velrix_admin());

drop policy if exists "calls_all_own_org" on calls;
create policy "calls_all_own_org_or_admin"
  on calls for all
  using (organization_id in (select user_organization_ids()) or is_velrix_admin())
  with check (organization_id in (select user_organization_ids()) or is_velrix_admin());

drop policy if exists "ai_settings_all_own_org" on ai_settings;
create policy "ai_settings_all_own_org_or_admin"
  on ai_settings for all
  using (organization_id in (select user_organization_ids()) or is_velrix_admin())
  with check (organization_id in (select user_organization_ids()) or is_velrix_admin());

drop policy if exists "calendar_connections_select_own_org" on calendar_connections;
create policy "calendar_connections_select_own_org_or_admin"
  on calendar_connections for select
  using (organization_id in (select user_organization_ids()) or is_velrix_admin());

drop policy if exists "calendar_connections_modify_owner_only" on calendar_connections;
create policy "calendar_connections_modify_owner_or_admin"
  on calendar_connections for all
  using (
    organization_id in (select organization_id from memberships where user_id = auth.uid() and role = 'owner')
    or is_velrix_admin()
  )
  with check (
    organization_id in (select organization_id from memberships where user_id = auth.uid() and role = 'owner')
    or is_velrix_admin()
  );
