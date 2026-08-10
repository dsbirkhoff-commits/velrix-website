-- VELRIX klantportaal — initieel database-schema
-- Uitvoeren via: Supabase Dashboard -> SQL Editor -> plak dit hele bestand -> Run
--
-- Ontwerp-uitgangspunten:
--   1. Elke tabel die klantdata bevat heeft een verplichte organization_id.
--   2. Row Level Security (RLS) is aan op elke tabel — de database zelf
--      weigert rijen van een andere organisatie te tonen, ongeacht wat de
--      applicatiecode doet. Dit is de belangrijkste beveiligingslaag.
--   3. auth.users (Supabase's eigen, ingebouwde gebruikerstabel) wordt
--      hergebruikt — er is geen eigen "users"-tabel nodig.
--   4. Google Calendar-koppeling staat in een eigen tabel
--      (calendar_connections), niet als kolommen op organizations, zodat
--      Organisatie A/B/C straks elk hun eigen koppeling kunnen krijgen
--      zonder het schema opnieuw te ontwerpen.

-- ---------------------------------------------------------------------
-- 1. organizations
-- ---------------------------------------------------------------------
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table organizations enable row level security;

-- ---------------------------------------------------------------------
-- 2. memberships — koppelt auth.users aan organizations
-- ---------------------------------------------------------------------
create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (user_id, organization_id)
);

alter table memberships enable row level security;

-- ---------------------------------------------------------------------
-- Herbruikbare helperfunctie: organisatie(s) van de ingelogde gebruiker.
-- security definer zodat deze de memberships-tabel mag lezen ongeacht de
-- RLS-policy van de aanroeper — puur een lookup, geen dataleak, want hij
-- geeft alleen org_id's terug voor auth.uid() (de ingelogde gebruiker
-- zelf), nooit voor een door de aanroeper opgegeven andere gebruiker.
-- MOET vóór elke policy staan die 'm gebruikt (organizations,
-- memberships zelf incluis) — anders faalt CREATE POLICY.
-- ---------------------------------------------------------------------
create or replace function user_organization_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select organization_id from memberships where user_id = auth.uid();
$$;

-- Nu memberships bestaat, kunnen de policies die ernaar verwijzen worden
-- aangemaakt (RLS-policies mogen pas na alle betrokken tabellen komen).

-- Een gebruiker mag alleen organisaties zien waar hij lid van is.
-- Gebruikt user_organization_ids() (security definer) i.p.v. een directe
-- subquery op memberships, om te voorkomen dat deze policy de RLS-policy
-- van memberships zelf opnieuw triggert (oneindige recursie) — gevangen
-- door een lokale test vóór deze migratie live ging, zie de commit-message.
create policy "organizations_select_own"
  on organizations for select
  using (
    id in (select user_organization_ids())
  );

-- Zelfde reden: memberships_select_same_org mag NIET zichzelf raadplegen
-- via een subquery op memberships — dat veroorzaakt oneindige recursie
-- omdat die subquery de policy opnieuw evalueert. user_organization_ids()
-- omzeilt dit (security definer, dus geen recursieve RLS-evaluatie).
create policy "memberships_select_same_org"
  on memberships for select
  using (
    organization_id in (select user_organization_ids())
  );

-- ---------------------------------------------------------------------
-- 3. customers
-- ---------------------------------------------------------------------
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  naam text not null,
  email text,
  telefoonnummer text,
  laatste_contact timestamptz,
  aantal_afspraken integer not null default 0,
  status text not null default 'actief' check (status in ('actief', 'inactief')),
  created_at timestamptz not null default now()
);

alter table customers enable row level security;

create policy "customers_all_own_org"
  on customers for all
  using (organization_id in (select user_organization_ids()))
  with check (organization_id in (select user_organization_ids()));

-- ---------------------------------------------------------------------
-- 4. appointments
-- ---------------------------------------------------------------------
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  datum date not null,
  tijd text not null, -- "HH:MM", bewust géén losse timestamptz — zie booking-flow docs over Europe/Amsterdam wall-clock tijd
  klantnaam text not null,
  email text,
  telefoonnummer text,
  type text not null default 'Gratis kennismaking',
  status text not null default 'bevestigd' check (status in ('bevestigd', 'geannuleerd', 'voltooid')),
  google_event_id text, -- koppelt terug naar het echte Google Calendar-event
  created_at timestamptz not null default now()
);

alter table appointments enable row level security;

create policy "appointments_all_own_org"
  on appointments for all
  using (organization_id in (select user_organization_ids()))
  with check (organization_id in (select user_organization_ids()));

-- ---------------------------------------------------------------------
-- 5. calls — structuur nu, data pas zodra VELRIX Reception actief is
-- ---------------------------------------------------------------------
create table if not exists calls (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  datum_tijd timestamptz not null default now(),
  caller text,
  duration_seconds integer,
  status text not null default 'voltooid' check (status in ('voltooid', 'gemist', 'doorverbonden')),
  transcript text,
  summary text,
  outcome text,
  created_at timestamptz not null default now()
);

alter table calls enable row level security;

create policy "calls_all_own_org"
  on calls for all
  using (organization_id in (select user_organization_ids()))
  with check (organization_id in (select user_organization_ids()));

-- ---------------------------------------------------------------------
-- 6. ai_settings — één rij per organisatie
-- ---------------------------------------------------------------------
create table if not exists ai_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references organizations(id) on delete cascade,
  bedrijfsnaam text,
  adres text,
  openingstijden jsonb not null default '{}'::jsonb,
  diensten text[] not null default '{}',
  faq jsonb not null default '[]'::jsonb,
  afspraakduur_minuten integer not null default 30,
  instructies text,
  updated_at timestamptz not null default now()
);

alter table ai_settings enable row level security;

create policy "ai_settings_all_own_org"
  on ai_settings for all
  using (organization_id in (select user_organization_ids()))
  with check (organization_id in (select user_organization_ids()));

-- ---------------------------------------------------------------------
-- 7. calendar_connections — voorbereid op per-organisatie Google Calendar
-- ---------------------------------------------------------------------
-- BELANGRIJK: encrypted_refresh_token is voorbereid maar wordt in deze MVP
-- NIET gebruikt — de bestaande, ene VELRIX-koppeling blijft volledig via
-- Vercel environment variables lopen (GOOGLE_REFRESH_TOKEN), zoals nu.
-- Zodra een tweede organisatie echt een eigen Google Calendar koppelt,
-- moet de waarde die hier wordt opgeslagen eerst applicatie-side versleuteld
-- worden (bijv. via Supabase Vault of een KMS) — nooit als platte tekst.
create table if not exists calendar_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references organizations(id) on delete cascade,
  status text not null default 'not_connected' check (status in ('connected', 'not_connected')),
  google_account_email text,
  calendar_id text,
  timezone text not null default 'Europe/Amsterdam',
  encrypted_refresh_token text, -- NIET gebruikt in MVP; zie opmerking hierboven
  connected_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table calendar_connections enable row level security;

create policy "calendar_connections_select_own_org"
  on calendar_connections for select
  using (organization_id in (select user_organization_ids()));

-- Alleen owners mogen (in de toekomst) de koppeling zelf wijzigen — voor
-- nu wordt deze tabel handmatig via de SQL editor beheerd, niet via de app.
create policy "calendar_connections_modify_owner_only"
  on calendar_connections for all
  using (
    organization_id in (
      select organization_id from memberships
      where user_id = auth.uid() and role = 'owner'
    )
  )
  with check (
    organization_id in (
      select organization_id from memberships
      where user_id = auth.uid() and role = 'owner'
    )
  );
