-- VELRIX — bestaande garagevelden migreren naar customers.custom_fields
-- Uitvoeren NA 0005_universal_core.sql, via Supabase SQL Editor.
--
-- STAP B van het implementatieplan. Dit bestand verwijdert BEWUST de oude
-- kolommen (kenteken, voertuig_merk, voertuig_model, bouwjaar) NIET —
-- dat gebeurt pas in een apart, later bestand, en alleen nadat de
-- verificatie hieronder is gecontroleerd. Veilig om dit bestand opnieuw
-- te draaien (idempotent: gebruikt jsonb-merge, overschrijft dezelfde
-- waarden gewoon opnieuw met zichzelf).

-- ---------------------------------------------------------------------
-- 1. Tel vooraf hoeveel records daadwerkelijk waarden hebben — dit is
--    de eerste output die je moet controleren voordat je verder kijkt.
-- ---------------------------------------------------------------------
select
  count(*) filter (where kenteken is not null) as heeft_kenteken,
  count(*) filter (where voertuig_merk is not null) as heeft_voertuig_merk,
  count(*) filter (where voertuig_model is not null) as heeft_voertuig_model,
  count(*) filter (where bouwjaar is not null) as heeft_bouwjaar,
  count(*) filter (where kenteken is not null or voertuig_merk is not null or voertuig_model is not null or bouwjaar is not null) as totaal_te_migreren_records
from customers;

-- ---------------------------------------------------------------------
-- 2. Migreer — merget in custom_fields, bestaande custom_fields-inhoud
--    (indien die er al zou zijn) blijft staan, alleen deze vier keys
--    worden toegevoegd/overschreven. NULL-waarden worden expliciet NIET
--    als lege JSONB-key toegevoegd (voorkomt "kenteken": null overal).
-- ---------------------------------------------------------------------
update customers
set custom_fields = custom_fields
  || case when kenteken is not null then jsonb_build_object('kenteken', kenteken) else '{}'::jsonb end
  || case when voertuig_merk is not null then jsonb_build_object('merk', voertuig_merk) else '{}'::jsonb end
  || case when voertuig_model is not null then jsonb_build_object('model', voertuig_model) else '{}'::jsonb end
  || case when bouwjaar is not null then jsonb_build_object('bouwjaar', bouwjaar) else '{}'::jsonb end
where kenteken is not null or voertuig_merk is not null or voertuig_model is not null or bouwjaar is not null;

-- ---------------------------------------------------------------------
-- 3. VERIFICATIE — vergelijkt de oude kolomwaarden met de nieuwe JSONB-
--    waarden, record voor record. Elke rij die hier verschijnt is een
--    afwijking. GEEN rijen in de output = volledige, exacte match.
-- ---------------------------------------------------------------------
select
  id,
  naam,
  kenteken as oude_kenteken,
  custom_fields->>'kenteken' as nieuwe_kenteken,
  voertuig_merk as oude_merk,
  custom_fields->>'merk' as nieuwe_merk,
  voertuig_model as oude_model,
  custom_fields->>'model' as nieuwe_model,
  bouwjaar as oude_bouwjaar,
  (custom_fields->>'bouwjaar')::integer as nieuwe_bouwjaar
from customers
where
  (kenteken is not null and custom_fields->>'kenteken' is distinct from kenteken)
  or (voertuig_merk is not null and custom_fields->>'merk' is distinct from voertuig_merk)
  or (voertuig_model is not null and custom_fields->>'model' is distinct from voertuig_model)
  or (bouwjaar is not null and (custom_fields->>'bouwjaar')::integer is distinct from bouwjaar);

-- ---------------------------------------------------------------------
-- 4. Zaad het custom-field-schema voor bestaande automotive-organisaties
--    (nu: VELRIX Demo Garage), zodat het klantformulier deze velden
--    meteen correct toont. Alleen als er nog geen schema bestaat, om
--    niets te overschrijven bij een herhaalde run.
-- ---------------------------------------------------------------------

-- Zet VELRIX Demo Garage eerst expliciet op industry='automotive' —
-- MOET vóór de INSERT hieronder komen, anders filtert die op niets.
update organizations set industry = 'automotive'
where id = '00000000-0000-0000-0000-0000000000d1' and industry is null;

insert into custom_field_definitions (organization_id, entity_type, field_key, label, data_type, sort_order, validation)
select o.id, 'customer', v.field_key, v.label, v.data_type, v.sort_order, v.validation
from organizations o
cross join (values
  ('kenteken', 'Kenteken', 'text', 1, '{"pattern": "^[0-9A-Za-z-]+$"}'::jsonb),
  ('merk', 'Merk', 'text', 2, null::jsonb),
  ('model', 'Model', 'text', 3, null::jsonb),
  ('bouwjaar', 'Bouwjaar', 'number', 4, '{"min": 1950, "max": 2030}'::jsonb)
) as v(field_key, label, data_type, sort_order, validation)
where o.industry = 'automotive'
  and not exists (
    select 1 from custom_field_definitions cfd
    where cfd.organization_id = o.id and cfd.entity_type = 'customer' and cfd.field_key = v.field_key
  );
