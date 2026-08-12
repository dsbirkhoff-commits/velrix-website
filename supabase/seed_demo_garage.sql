-- VELRIX klantportaal — "VELRIX Demo Garage" testomgeving voor daniel@velrix.nl.
--
-- Los van supabase/seed.sql (die blijft ongewijzigd en nodig voor de
-- publieke boekingsflow-sync naar de echte "VELRIX"-organisatie). Dit
-- script voegt een APARTE, tweede organisatie toe specifiek om zelf de
-- klantervaring in te kunnen loggen en te bekijken.
--
-- Zoekt het account zelf op via e-mailadres (auth.users) — je hoeft dus
-- geen User UID meer handmatig te kopiëren of te plakken. Veilig om
-- opnieuw te draaien (idempotent): bestaande rijen worden niet
-- gedupliceerd. Uitvoeren via Supabase Dashboard -> SQL Editor, NIET via
-- de website — dit is bewust een server-side/admin-only handeling.
--
-- VOORWAARDE: het account daniel@velrix.nl moet al bestaan in
-- Authentication -> Users (via "Invite user" of "Add user"). Bestaat het
-- nog niet, dan voegen de stappen hieronder simpelweg niets toe (geen
-- foutmelding, maar ook geen koppeling) — check dat eerst.

insert into organizations (id, name)
values ('00000000-0000-0000-0000-0000000000d1', 'VELRIX Demo Garage')
on conflict (id) do nothing;

-- Verwijdert een eventueel eerder lidmaatschap van hetzelfde account in de
-- ECHTE "VELRIX"-organisatie (uit supabase/seed.sql). Zonder deze stap
-- zou je account TWEE organisaties hebben, en zonder vaste volgorde is
-- niet gegarandeerd welke het dashboard toont — precies de dubbelzinnig-
-- heid die je wilt vermijden. De echte "VELRIX"-organisatie zelf, en de
-- boekingssync ernaartoe, blijven volledig intact; alleen JOUW koppeling
-- eraan wordt hier verwijderd, zodat je account voortaan uitsluitend bij
-- "VELRIX Demo Garage" hoort.
delete from memberships
where user_id = (select id from auth.users where email = 'daniel@velrix.nl')
  and organization_id = '00000000-0000-0000-0000-000000000001';

insert into memberships (user_id, organization_id, role)
select id, '00000000-0000-0000-0000-0000000000d1', 'owner'
from auth.users
where email = 'daniel@velrix.nl'
on conflict (user_id, organization_id) do nothing;

-- Bewust GEEN calendar_connections-rij: de instellingenpagina toont dan
-- terecht de "Google Calendar koppelen"-placeholder, niet "Verbonden" —
-- dit is een demo-organisatie, geen echte, gekoppelde agenda.

-- Bewust een lege ai_settings-rij (alleen bedrijfsnaam) i.p.v. verzonnen
-- openingstijden/diensten — de AI Receptionist-pagina toont dan een
-- eerlijke, nog-in-te-vullen staat in plaats van nepdata.
insert into ai_settings (organization_id, bedrijfsnaam)
values ('00000000-0000-0000-0000-0000000000d1', 'VELRIX Demo Garage')
on conflict (organization_id) do nothing;

-- Verificatie: dit zou nu precies één rij moeten teruggeven. Geen rij?
-- Dan bestaat het account daniel@velrix.nl nog niet in Authentication ->
-- Users — zie de voorwaarde hierboven.
select
  u.email,
  o.name as organization,
  m.role
from memberships m
join auth.users u on u.id = m.user_id
join organizations o on o.id = m.organization_id
where u.email = 'daniel@velrix.nl' and o.id = '00000000-0000-0000-0000-0000000000d1';
