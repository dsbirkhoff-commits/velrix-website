-- VELRIX klantportaal — eenmalige seed.
--
-- UITVOEREN NADAT:
--   1. supabase/migrations/0001_init.sql EN 0002_admin_role.sql zijn gedraaid, EN
--   2. je zelf twee gebruikers hebt aangemaakt via
--      Supabase Dashboard -> Authentication -> Users -> Add user:
--        a) daniel@velrix.nl        (jij, wordt VELRIX-admin)
--        b) een tweede test-e-mailadres naar keuze (bijv.
--           test@testgarage.nl), wordt de testorganisatie-gebruiker
--      Zelf een wachtwoord kiezen bij beide.
--
-- Vervang de twee placeholders hieronder door de "User UID" die Supabase
-- bij elke gebruiker toont (Authentication -> Users -> klik op de
-- gebruiker -> "User UID" bovenaan).

-- 1. Daniël wordt VELRIX-admin (platform-breed, geen organisatiegrens)
insert into profiles (id, is_velrix_admin)
values ('<DANIEL_USER_ID>', true)
on conflict (id) do update set is_velrix_admin = true;

-- 2. VELRIX zelf als organisatie (voor de bestaande, echte boekingsflow)
insert into organizations (id, name)
values ('00000000-0000-0000-0000-000000000001', 'VELRIX')
on conflict (id) do nothing;

insert into memberships (user_id, organization_id, role)
values ('<DANIEL_USER_ID>', '00000000-0000-0000-0000-000000000001', 'owner')
on conflict (user_id, organization_id) do nothing;

insert into calendar_connections (organization_id, status, calendar_id, timezone, connected_at)
values ('00000000-0000-0000-0000-000000000001', 'connected', 'primary', 'Europe/Amsterdam', now())
on conflict (organization_id) do nothing;

insert into ai_settings (organization_id, bedrijfsnaam)
values ('00000000-0000-0000-0000-000000000001', 'VELRIX')
on conflict (organization_id) do nothing;

-- 3. Een APARTE testorganisatie, met een eigen testgebruiker — dit is
--    waarmee je het klantportaal zelf test, en waarmee de scheiding
--    tussen twee ECHTE, verschillende klanten (niet alleen VELRIX)
--    aantoonbaar wordt.
insert into organizations (id, name)
values ('00000000-0000-0000-0000-000000000002', 'Testgarage BV')
on conflict (id) do nothing;

insert into memberships (user_id, organization_id, role)
values ('<TEST_USER_ID>', '00000000-0000-0000-0000-000000000002', 'owner')
on conflict (user_id, organization_id) do nothing;

-- Bewust GEEN calendar_connections-rij voor de testorganisatie: die moet
-- in de instellingenpagina de "Google Calendar koppelen"-placeholder
-- tonen, niet "Verbonden".

insert into ai_settings (organization_id, bedrijfsnaam)
values ('00000000-0000-0000-0000-000000000002', 'Testgarage BV')
on conflict (organization_id) do nothing;
