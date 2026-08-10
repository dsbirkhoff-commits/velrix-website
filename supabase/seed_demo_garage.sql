-- VELRIX klantportaal — "VELRIX Demo Garage" testomgeving voor daniel@velrix.nl.
--
-- Los van supabase/seed.sql (die blijft ongewijzigd en nodig voor de
-- publieke boekingsflow-sync naar de echte "VELRIX"-organisatie). Dit
-- script voegt een APARTE, tweede organisatie toe specifiek om zelf de
-- klantervaring in te kunnen loggen en te bekijken.
--
-- UITVOEREN NADAT je in Supabase Dashboard -> Authentication -> Users
-- op "Invite user" hebt geklikt voor daniel@velrix.nl (zie de
-- leveringstekst voor de exacte stappen) — dan bestaat de auth.users-rij
-- al en kun je hier de User UID invullen.

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
where user_id = '<DANIEL_USER_ID>'
  and organization_id = '00000000-0000-0000-0000-000000000001';

insert into memberships (user_id, organization_id, role)
values ('<DANIEL_USER_ID>', '00000000-0000-0000-0000-0000000000d1', 'owner')
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
