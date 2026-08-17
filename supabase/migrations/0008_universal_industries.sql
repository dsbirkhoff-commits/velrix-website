-- VELRIX — universele branchecatalogus (10 kerntemplates, ~60 branches)
-- Uitvoeren NA 0001 t/m 0007, via Supabase SQL Editor.
--
-- Volledig additief en idempotent — niets bestaands wordt verwijderd,
-- hernoemd of overschreven. VELRIX Demo Garage, de bestaande
-- 'automotive'-industry, en haar bestaande custom_fields blijven exact
-- zoals ze zijn.

-- ---------------------------------------------------------------------
-- 1. industries.template_id — NIEUWE, additieve kolom. Dit wordt de
--    primaire "standaardtemplate"-relatie: meerdere industries mogen
--    naar dezelfde template verwijzen. De bestaande
--    custom_field_templates.industry_id (1 template -> 1 industry)
--    blijft volledig ongemoeid — niet verwijderd, niet hernoemd, niet
--    gebruikt door deze nieuwe flow.
-- ---------------------------------------------------------------------
alter table industries add column if not exists template_id uuid references custom_field_templates(id);

-- ---------------------------------------------------------------------
-- 2. De 10 kerntemplates — idempotent via een expliciete NOT EXISTS-
--    check (custom_field_templates.name heeft geen unique constraint,
--    dus ON CONFLICT is hier niet bruikbaar; dit geeft hetzelfde,
--    veilige resultaat).
-- ---------------------------------------------------------------------
insert into custom_field_templates (name, industry_id, active)
select v.name, null, true
from (values
  ('Automotive'),
  ('Home Services'),
  ('Beauty'),
  ('Vastgoed & Finance'),
  ('Gezondheid & Praktijken'),
  ('Zakelijke Dienstverlening'),
  ('Fitness & Coaching'),
  ('Hospitality & Events'),
  ('Onderwijs & Training'),
  ('Overig / Custom')
) as v(name)
where not exists (select 1 from custom_field_templates t where t.name = v.name);

-- ---------------------------------------------------------------------
-- 3. Velden per template. Automotive gebruikt bewust dezelfde veld-
--    namen als de al live gebruikte custom_fields (kenteken/merk/model/
--    bouwjaar) — NIET voertuig_merk/voertuig_model, om consistentie met
--    bestaande data te bewaren. ON CONFLICT (template_id, field_key) is
--    hier wel bruikbaar, want die unique constraint bestaat al.
-- ---------------------------------------------------------------------
insert into custom_field_template_fields (template_id, field_key, label, data_type, required, sort_order, visible)
select t.id, v.field_key, v.label, v.data_type, false, v.sort_order, true
from custom_field_templates t
join (values
  -- Automotive
  ('Automotive', 'kenteken', 'Kenteken', 'text', 1),
  ('Automotive', 'merk', 'Merk', 'text', 2),
  ('Automotive', 'model', 'Model', 'text', 3),
  ('Automotive', 'bouwjaar', 'Bouwjaar', 'number', 4),
  -- Home Services
  ('Home Services', 'service_adres', 'Serviceadres', 'text', 1),
  ('Home Services', 'type_dienst', 'Type dienst', 'text', 2),
  ('Home Services', 'omschrijving', 'Omschrijving', 'text', 3),
  ('Home Services', 'urgentie', 'Urgentie', 'text', 4),
  ('Home Services', 'gewenste_datum', 'Gewenste datum', 'date', 5),
  -- Beauty
  ('Beauty', 'behandeling', 'Behandeling', 'text', 1),
  ('Beauty', 'voorkeur_medewerker', 'Voorkeursmedewerker', 'text', 2),
  ('Beauty', 'voorkeur_datum', 'Voorkeursdatum', 'date', 3),
  ('Beauty', 'opmerkingen', 'Opmerkingen', 'text', 4),
  -- Vastgoed & Finance
  ('Vastgoed & Finance', 'type_aanvraag', 'Type aanvraag', 'text', 1),
  ('Vastgoed & Finance', 'locatie', 'Locatie', 'text', 2),
  ('Vastgoed & Finance', 'budget', 'Budget', 'text', 3),
  ('Vastgoed & Finance', 'gewenste_datum', 'Gewenste datum', 'date', 4),
  ('Vastgoed & Finance', 'opmerkingen', 'Opmerkingen', 'text', 5),
  -- Gezondheid & Praktijken (bewust geen medische/gevoelige velden)
  ('Gezondheid & Praktijken', 'type_afspraak', 'Type afspraak', 'text', 1),
  ('Gezondheid & Praktijken', 'gewenste_datum', 'Gewenste datum', 'date', 2),
  ('Gezondheid & Praktijken', 'voorkeur_medewerker', 'Voorkeursmedewerker', 'text', 3),
  ('Gezondheid & Praktijken', 'opmerkingen', 'Opmerkingen', 'text', 4),
  -- Zakelijke Dienstverlening
  ('Zakelijke Dienstverlening', 'type_aanvraag', 'Type aanvraag', 'text', 1),
  ('Zakelijke Dienstverlening', 'bedrijfsnaam', 'Bedrijfsnaam', 'text', 2),
  ('Zakelijke Dienstverlening', 'onderwerp', 'Onderwerp', 'text', 3),
  ('Zakelijke Dienstverlening', 'gewenste_datum', 'Gewenste datum', 'date', 4),
  ('Zakelijke Dienstverlening', 'opmerkingen', 'Opmerkingen', 'text', 5),
  -- Fitness & Coaching
  ('Fitness & Coaching', 'type_sessie', 'Type sessie', 'text', 1),
  ('Fitness & Coaching', 'niveau', 'Niveau', 'text', 2),
  ('Fitness & Coaching', 'voorkeur_medewerker', 'Voorkeursmedewerker', 'text', 3),
  ('Fitness & Coaching', 'gewenste_datum', 'Gewenste datum', 'date', 4),
  ('Fitness & Coaching', 'opmerkingen', 'Opmerkingen', 'text', 5),
  -- Hospitality & Events
  ('Hospitality & Events', 'type_reservering', 'Type reservering', 'text', 1),
  ('Hospitality & Events', 'aantal_personen', 'Aantal personen', 'number', 2),
  ('Hospitality & Events', 'gewenste_datum', 'Gewenste datum', 'date', 3),
  ('Hospitality & Events', 'gewenste_tijd', 'Gewenste tijd', 'text', 4),
  ('Hospitality & Events', 'opmerkingen', 'Opmerkingen', 'text', 5),
  -- Onderwijs & Training
  ('Onderwijs & Training', 'type_training', 'Type training', 'text', 1),
  ('Onderwijs & Training', 'niveau', 'Niveau', 'text', 2),
  ('Onderwijs & Training', 'gewenste_datum', 'Gewenste datum', 'date', 3),
  ('Onderwijs & Training', 'voorkeur_medewerker', 'Voorkeursmedewerker', 'text', 4),
  ('Onderwijs & Training', 'opmerkingen', 'Opmerkingen', 'text', 5)
  -- Overig / Custom: bewust geen velden, zoals gevraagd
) as v(template_name, field_key, label, data_type, sort_order)
  on t.name = v.template_name
on conflict (template_id, field_key) do nothing;

-- ---------------------------------------------------------------------
-- 4. Koppel de BESTAANDE 'automotive'-industry aan de nieuwe Automotive-
--    template — alleen als er nog geen template_id gezet is (raakt geen
--    enkele organisatie, alleen de industries-rij zelf).
-- ---------------------------------------------------------------------
update industries
set template_id = (select id from custom_field_templates where name = 'Automotive')
where slug = 'automotive' and template_id is null;

-- ---------------------------------------------------------------------
-- 5. ~60 nieuwe, fijnmazige branches, elk gekoppeld aan hun kern-
--    template. De bestaande 'automotive'-industry wordt hier NIET
--    opnieuw aangemaakt of gewijzigd — dit voegt uitsluitend nieuwe,
--    aanvullende branches toe.
-- ---------------------------------------------------------------------
insert into industries (name, slug, active, sort_order, template_id)
select v.name, v.slug, true, v.sort_order, t.id
from (values
  -- Automotive
  ('Garages', 'garages', 10, 'Automotive'),
  ('Autodealers', 'autodealers', 11, 'Automotive'),
  ('Autoschadebedrijven', 'autoschade', 12, 'Automotive'),
  ('Car detailing', 'car-detailing', 13, 'Automotive'),
  ('Bandenservice', 'bandenservice', 14, 'Automotive'),
  -- Home Services
  ('Installatiebedrijven', 'installatiebedrijven', 20, 'Home Services'),
  ('Elektriciens', 'elektriciens', 21, 'Home Services'),
  ('Loodgieters', 'loodgieters', 22, 'Home Services'),
  ('Schilders', 'schilders', 23, 'Home Services'),
  ('Timmerbedrijven', 'timmerbedrijven', 24, 'Home Services'),
  ('Dakdekkers', 'dakdekkers', 25, 'Home Services'),
  ('Glaszetters', 'glaszetters', 26, 'Home Services'),
  ('Kozijnbedrijven', 'kozijnbedrijven', 27, 'Home Services'),
  ('Zonweringbedrijven', 'zonweringbedrijven', 28, 'Home Services'),
  ('Airconditioningbedrijven', 'airconditioning', 29, 'Home Services'),
  ('Warmtepompbedrijven', 'warmtepompen', 30, 'Home Services'),
  ('Ongediertebestrijding', 'ongediertebestrijding', 31, 'Home Services'),
  ('Verhuisbedrijven', 'verhuisbedrijven', 32, 'Home Services'),
  ('Hoveniers', 'hoveniers', 33, 'Home Services'),
  ('Schoonmaakbedrijven', 'schoonmaakbedrijven', 34, 'Home Services'),
  ('Bouwbedrijven', 'bouwbedrijven', 35, 'Home Services'),
  -- Beauty
  ('Kappers', 'kappers', 40, 'Beauty'),
  ('Barbers', 'barbers', 41, 'Beauty'),
  ('Beautysalons', 'beautysalons', 42, 'Beauty'),
  ('Nagelstudio''s', 'nagelstudios', 43, 'Beauty'),
  ('Schoonheidsspecialisten', 'schoonheidsspecialisten', 44, 'Beauty'),
  -- Vastgoed & Finance
  ('Makelaars', 'makelaars', 50, 'Vastgoed & Finance'),
  ('Vastgoedbeheer', 'vastgoedbeheer', 51, 'Vastgoed & Finance'),
  ('Hypotheekadviseurs', 'hypotheekadviseurs', 52, 'Vastgoed & Finance'),
  ('Verzekeringsadviseurs', 'verzekeringsadviseurs', 53, 'Vastgoed & Finance'),
  ('Financieel adviseurs', 'financieel-adviseurs', 54, 'Vastgoed & Finance'),
  -- Gezondheid & Praktijken
  ('Fysiotherapeuten', 'fysiotherapeuten', 60, 'Gezondheid & Praktijken'),
  ('Tandartspraktijken', 'tandartspraktijken', 61, 'Gezondheid & Praktijken'),
  ('Psychologen', 'psychologen', 62, 'Gezondheid & Praktijken'),
  ('Coaches', 'coaches', 63, 'Gezondheid & Praktijken'),
  ('Dierenartsen', 'dierenartsen', 64, 'Gezondheid & Praktijken'),
  -- Zakelijke Dienstverlening
  ('Advocatenkantoren', 'advocatenkantoren', 70, 'Zakelijke Dienstverlening'),
  ('Accountants', 'accountants', 71, 'Zakelijke Dienstverlening'),
  ('Administratiekantoren', 'administratiekantoren', 72, 'Zakelijke Dienstverlening'),
  ('Marketingbureaus', 'marketingbureaus', 73, 'Zakelijke Dienstverlening'),
  ('Webdesignbureaus', 'webdesignbureaus', 74, 'Zakelijke Dienstverlening'),
  ('IT-bedrijven', 'it-bedrijven', 75, 'Zakelijke Dienstverlening'),
  ('Softwarebedrijven', 'softwarebedrijven', 76, 'Zakelijke Dienstverlening'),
  ('Adviesbureaus', 'adviesbureaus', 77, 'Zakelijke Dienstverlening'),
  ('Recruitmentbureaus', 'recruitmentbureaus', 78, 'Zakelijke Dienstverlening'),
  ('Uitzendbureaus', 'uitzendbureaus', 79, 'Zakelijke Dienstverlening'),
  ('Architecten', 'architecten', 80, 'Zakelijke Dienstverlening'),
  ('Ingenieursbureaus', 'ingenieursbureaus', 81, 'Zakelijke Dienstverlening'),
  ('Fotostudio''s', 'fotostudios', 82, 'Zakelijke Dienstverlening'),
  ('Videoproductiebedrijven', 'videoproductiebedrijven', 83, 'Zakelijke Dienstverlening'),
  -- Fitness & Coaching (Opleidingsinstituten bewust NIET hier nogmaals
  -- opgenomen — zie toelichting in de leveringstekst, staat al onder
  -- Onderwijs & Training om een naam/slug-botsing te voorkomen)
  ('Sportscholen', 'sportscholen', 90, 'Fitness & Coaching'),
  ('Personal trainers', 'personal-trainers', 91, 'Fitness & Coaching'),
  ('Yoga/Pilates studio''s', 'yoga-pilates-studios', 92, 'Fitness & Coaching'),
  ('Dansscholen', 'dansscholen', 93, 'Fitness & Coaching'),
  ('Zwemscholen', 'zwemscholen', 94, 'Fitness & Coaching'),
  -- Hospitality & Events
  ('Restaurants', 'restaurants', 100, 'Hospitality & Events'),
  ('Hotels', 'hotels', 101, 'Hospitality & Events'),
  ('Bed & Breakfasts', 'bed-and-breakfasts', 102, 'Hospitality & Events'),
  ('Cateringbedrijven', 'cateringbedrijven', 103, 'Hospitality & Events'),
  ('Eventbedrijven', 'eventbedrijven', 104, 'Hospitality & Events'),
  ('Weddingplanners', 'weddingplanners', 105, 'Hospitality & Events'),
  -- Onderwijs & Training
  ('Rijscholen', 'rijscholen', 110, 'Onderwijs & Training'),
  ('Trainingsbedrijven', 'trainingsbedrijven', 111, 'Onderwijs & Training'),
  ('Cursusaanbieders', 'cursusaanbieders', 112, 'Onderwijs & Training'),
  ('Bijlesbedrijven', 'bijlesbedrijven', 113, 'Onderwijs & Training'),
  ('Opleidingsinstituten', 'opleidingsinstituten', 114, 'Onderwijs & Training'),
  -- Overig / Custom
  ('Overig / Custom', 'overig-custom', 999, 'Overig / Custom')
) as v(name, slug, sort_order, template_name)
join custom_field_templates t on t.name = v.template_name
on conflict (slug) do nothing;
