/**
 * VELRIX Voice AI — demo conversation engine.
 *
 * IMPORTANT: this is intent-matching + scripted state transitions, not a
 * real language model. It only understands the phrasings it's built to
 * recognize, never invents facts (prices, addresses, availability), and
 * says so plainly when a question falls outside the demo knowledge base.
 *
 * Interface contract (kept stable on purpose — see PRODUCTION ROADMAP
 * in /docs/voice-ai-roadmap.md):
 *
 *   nextTurn({ step, context, userText }) => {
 *     aiText: string,
 *     nextStep: string,
 *     context?: object,
 *     showSlots?: boolean,
 *     demoBooking?: { service, slot, namePlate } | null,
 *   }
 *
 * A future production version can swap the *implementation* of nextTurn()
 * for a real LLM call (server-side, behind an /api route so no key ever
 * reaches the browser) while every caller — the UI, the speech hook —
 * stays exactly the same.
 */

export const DEMO_GARAGE = {
  name: "VELRIX Demo Garage",
  services: ["APK", "Onderhoud", "Reparatie", "Bandenwissel", "Airco", "Diagnose"],
  hoursText: "maandag tot en met vrijdag van 08:00 tot 17:30, en zaterdag van 09:00 tot 14:00. Op zondag zijn we gesloten.",
};

// Fixed example slots, exactly as specified — not tied to any real calendar.
export const DEMO_SLOTS = ["Donderdag 10:00", "Donderdag 14:30", "Vrijdag 09:00"];

const OUT_OF_SCOPE_REPLY = "Dat kan ik in deze demo niet betrouwbaar voor u beantwoorden.";

function norm(text) {
  return (text || "").toLowerCase().trim();
}

function matchesAny(text, patterns) {
  return patterns.some((p) => text.includes(p));
}

function detectIntent(text) {
  const t = norm(text);
  if (matchesAny(t, ["apk", "keuring", "keuren"])) return "apk";
  if (matchesAny(t, ["onderhoud", "beurt", "servicebeurt"])) return "onderhoud";
  if (matchesAny(t, ["reparatie", "repareren", "repareer", "kapot", "defect", "storing"])) return "reparatie";
  if (matchesAny(t, ["band", "banden", "lekke band"])) return "banden";
  if (matchesAny(t, ["airco"])) return "airco";
  if (matchesAny(t, ["diagnose", "lampje", "controlelamp"])) return "diagnose";
  if (matchesAny(t, ["open", "openingstijd", "geopend", "hoe laat"])) return "hours";
  if (matchesAny(t, ["prijs", "kost", "duur", "kosten"])) return "price";
  if (matchesAny(t, ["waar zit", "waar zitten", "adres", "locatie", "waar ben"])) return "location";
  if (matchesAny(t, ["morgen langs", "langskomen", "afspraak maken", "kan ik langskomen"])) return "generic_appointment";
  return "unknown";
}

function matchSlot(text) {
  const t = norm(text);
  // Match on the exact time first — times are unique per slot, so this is
  // unambiguous even when the day is also mentioned ("donderdag 14:30").
  const byTime = DEMO_SLOTS.find((slot) => t.includes(slot.split(" ")[1]));
  if (byTime) return byTime;
  // Fall back to day-only matching (e.g. just "donderdag") — picks the
  // first slot on that day.
  return DEMO_SLOTS.find((slot) => t.includes(slot.split(" ")[0].toLowerCase()));
}

export function nextTurn({ step, context, userText }) {
  const t = norm(userText);

  switch (step) {
    case "greeting": {
      if (context.simulateClosed) {
        return {
          aiText:
            "Onze werkplaats is momenteel gesloten. Ik kan wel alvast uw gegevens en aanvraag noteren. Waar gaat het om?",
          nextStep: "closed_intake_reason",
        };
      }
      return { aiText: `Goedemiddag, u spreekt met ${DEMO_GARAGE.name}. Waar kan ik u mee helpen?`, nextStep: "await_intent" };
    }

    case "await_intent": {
      const intent = detectIntent(t);

      if (intent === "hours") {
        return { aiText: `We zijn ${DEMO_GARAGE.hoursText} Waar kan ik u verder mee helpen?`, nextStep: "await_intent" };
      }
      if (intent === "price" || intent === "location") {
        return { aiText: `${OUT_OF_SCOPE_REPLY} Waar kan ik u verder mee helpen?`, nextStep: "await_intent" };
      }
      if (intent === "apk") {
        return { aiText: "Natuurlijk. Wanneer zou u ongeveer langs willen komen?", nextStep: "await_slot", context: { ...context, flow: "apk", service: "APK-keuring" } };
      }
      if (intent === "onderhoud") {
        return { aiText: "Dat kunnen we regelen. Weet u toevallig welk type onderhoud uw auto nodig heeft?", nextStep: "onderhoud_detail", context: { ...context, flow: "onderhoud", service: "Onderhoudsbeurt" } };
      }
      if (intent === "generic_appointment") {
        return { aiText: "Zeker, dat kunnen we inplannen. Wanneer zou u ongeveer langs willen komen?", nextStep: "await_slot", context: { ...context, flow: "afspraak", service: "Afspraak" } };
      }
      if (["reparatie", "banden", "airco", "diagnose"].includes(intent)) {
        const service = { reparatie: "Reparatie", banden: "Bandenwissel", airco: "Airco-onderhoud", diagnose: "Diagnose" }[intent];
        return { aiText: `Duidelijk, ${service.toLowerCase()}. Zullen we daar een moment voor inplannen?`, nextStep: "await_slot", context: { ...context, flow: intent, service } };
      }
      return {
        aiText: "Sorry, dat versta ik niet helemaal. Gaat het om een APK, onderhoud, reparatie, bandenwissel, airco of een diagnose?",
        nextStep: "await_intent",
      };
    }

    case "onderhoud_detail": {
      return {
        aiText: "Duidelijk, dank u. Zullen we gelijk een moment inplannen zodat we ernaar kunnen kijken?",
        nextStep: "await_slot",
      };
    }

    case "await_slot": {
      const slot = matchSlot(t);
      if (!slot) {
        return {
          aiText: `Dit zijn de opties voor deze demo: ${DEMO_SLOTS.join(", ")}. Welke komt u uit?`,
          nextStep: "await_slot",
          showSlots: true,
        };
      }
      return {
        aiText: `Prima. Voor deze demo zet ik ${slot.toLowerCase()} als gekozen tijd. Mag ik uw naam en kenteken?`,
        nextStep: "await_name_plate",
        context: { ...context, chosenSlot: slot },
      };
    }

    case "await_name_plate": {
      if (!userText || userText.trim().length < 2) {
        return { aiText: "Sorry, ik heb dat niet goed verstaan. Mag ik uw naam en kenteken nog eens?", nextStep: "await_name_plate" };
      }
      const namePlate = userText.trim();
      return {
        aiText: "Bedankt. De demo-afspraak staat klaar.",
        nextStep: "confirmed",
        context: { ...context, namePlate },
        demoBooking: { service: context.service || "Afspraak", slot: context.chosenSlot, namePlate },
      };
    }

    case "closed_intake_reason": {
      return { aiText: "Dank u. Mag ik ook uw naam en telefoonnummer, zodat we u tijdens openingstijden kunnen terugbellen?", nextStep: "closed_intake_contact", context: { ...context, closedReason: userText } };
    }

    case "closed_intake_contact": {
      return {
        aiText: "Genoteerd voor deze demo. In het echte product nemen we tijdens openingstijden contact met u op. Fijne dag verder.",
        nextStep: "confirmed",
        context: { ...context, closedContact: userText },
        demoBooking: { service: "Terugbelverzoek (demo)", slot: null, namePlate: userText },
      };
    }

    default:
      return { aiText: "Dank u voor het gesprek. Tot ziens.", nextStep: "confirmed" };
  }
}
