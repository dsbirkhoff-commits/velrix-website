-- VELRIX klantportaal — eenmalige seed voor de eerste/testorganisatie.
--
-- UITVOEREN NADAT:
--   1. supabase/migrations/0001_init.sql is gedraaid, EN
--   2. je zelf een gebruiker hebt aangemaakt via
--      Supabase Dashboard -> Authentication -> Users -> Add user
--      (e-mail: bijv. daniel@velrix.nl, zelf een wachtwoord kiezen)
--
-- Vervang '<JOUW_USER_ID>' hieronder door de "User UID" die Supabase bij
-- die nieuwe gebruiker toont (Authentication -> Users -> klik op de
-- gebruiker -> "User UID" bovenaan, een lange reeks met streepjes).

insert into organizations (id, name)
values ('00000000-0000-0000-0000-000000000001', 'VELRIX')
returning id; -- bewaar deze id, nodig voor de VELRIX_SEED_ORGANIZATION_ID env var in Vercel

insert into memberships (user_id, organization_id, role)
values ('<JOUW_USER_ID>', '00000000-0000-0000-0000-000000000001', 'owner');

-- Toont in de dashboard-instellingen "Google Calendar — Verbonden met
-- VELRIX", zonder de echte refresh token hier op te slaan — die blijft
-- gewoon in Vercel's GOOGLE_REFRESH_TOKEN staan, exact zoals nu.
insert into calendar_connections (organization_id, status, calendar_id, timezone, connected_at)
values ('00000000-0000-0000-0000-000000000001', 'connected', 'primary', 'Europe/Amsterdam', now());

-- Optioneel maar aanbevolen: lege ai_settings-rij zodat de
-- AI Receptionist-pagina meteen een leeg formulier toont in plaats van
-- pas na de eerste keer opslaan.
insert into ai_settings (organization_id, bedrijfsnaam)
values ('00000000-0000-0000-0000-000000000001', 'VELRIX');
