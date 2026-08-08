/**
 * VELRIX Voice AI — demo conversation engine.
 *
 * IMPORTANT: this is intent-matching + scripted state transitions, not a
 * real language model. It only understands the phrasings it's built to
 * recognize. A production version would swap this module for a real LLM
 * (with a paid API) while keeping the same interface — see README notes.
 */

export const DEMO_GARAGE = {
  name: "VELRIX Demo Garage",
  services: ["APK", "Onderhoud", "Reparatie", "Bandenwissel", "Airco", "Diagnose"],
  hoursText: "maandag t/m vrijdag van 08:00 tot 17:30, en zaterdag van 09:00 tot 14:00. Op zondag zijn we gesloten.",
};

// Fixed example slots, exactly as specified — not tied to any real calendar.
const DEMO_SLOTS = ["Donderdag 10:00", "Donderdag 14:30", "Vrijdag 09:00"];

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
  if (matchesAny(t, ["reparatie", "kapot", "defect", "storing"])) return "reparatie";
  if (matchesAny(t, ["band", "banden", "lekke band"])) return "banden";
  if (matchesAny(t, ["airco"])) return "airco";
  if (matchesAny(t, ["diagnose", "lampje", "controlelamp"])) return "diagnose";
  if (matchesAny(t, ["open", "openingstijd", "geopend", "hoe laat"])) return "hours";
  if (matchesAny(t, ["prijs", "kost", "duur", "kosten"])) return "price";
  return "unknown";
}

function matchSlot(text) {
  const t = norm(text);
  return DEMO_SLOTS.find((slot) => {
    const [day, time] = slot.split(" ");
    return t.includes(day.toLowerCase()) || t.includes(time);
  });
}

/**
 * Pure function: given the current step + the user's (transcribed) utterance
 * + demo context (e.g. simulateClosed), returns what the AI says next and
 * which step to move to. No side effects, easy to unit test.
 */
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
      if (intent === "price") {
        return {
          aiText:
            "Dat kan ik zo zonder de auto gezien te hebben niet exact zeggen. Zullen we een moment inplannen zodat we ernaar kunnen kijken?",
          nextStep: "await_intent",
        };
      }
      if (intent === "apk") {
        return { aiText: "Natuurlijk. Ik kan u daarbij helpen. Wanneer zou u ongeveer langs willen komen?", nextStep: "await_slot", context: { ...context, flow: "apk" } };
      }
      if (intent === "onderhoud") {
        return { aiText: "Dat kunnen we regelen. Weet u toevallig welk type onderhoud uw auto nodig heeft?", nextStep: "onderhoud_detail", context: { ...context, flow: "onderhoud" } };
      }
      if (["reparatie", "banden", "airco", "diagnose"].includes(intent)) {
        const label = { reparatie: "een reparatie", banden: "een bandenwissel", airco: "de airco", diagnose: "een diagnose" }[intent];
        return { aiText: `Duidelijk, ${label}. Zullen we daar een moment voor inplannen?`, nextStep: "await_slot", context: { ...context, flow: intent } };
      }
      return {
        aiText: "Sorry, dat versta ik niet helemaal. Gaat het om een APK, onderhoud, reparatie, bandenwissel, airco of een diagnose?",
        nextStep: "await_intent",
      };
    }

    case "onderhoud_detail": {
      // We don't invent specifics — just acknowledge naturally and move to scheduling.
      return {
        aiText: "Duidelijk, dank u. Zullen we gelijk een moment inplannen zodat we ernaar kunnen kijken?",
        nextStep: "await_slot",
      };
    }

    case "await_slot": {
      const slot = matchSlot(t) || context.pendingSlotFromClick;
      if (!slot) {
        return {
          aiText: `Ik heb nog geen tijd verstaan. Dit zijn de opties: ${DEMO_SLOTS.join(", ")}. Welke komt u uit?`,
          nextStep: "await_slot",
          showSlots: true,
        };
      }
      return {
        aiText: `Prima. Dan zet ik de afspraak voorlopig op ${slot.toLowerCase()}. Mag ik uw naam en kenteken?`,
        nextStep: "await_name_plate",
        context: { ...context, chosenSlot: slot },
      };
    }

    case "await_name_plate": {
      if (!userText || userText.trim().length < 2) {
        return { aiText: "Sorry, ik heb dat niet goed verstaan. Mag ik uw naam en kenteken nog eens?", nextStep: "await_name_plate" };
      }
      return {
        aiText: `Dank u wel. Ik heb de afspraak voor ${context.chosenSlot.toLowerCase()} voor u genoteerd als testafspraak.`,
        nextStep: "confirmed",
        context: { ...context, namePlate: userText.trim() },
      };
    }

    case "closed_intake_reason": {
      return { aiText: "Dank u. Mag ik ook uw naam en telefoonnummer, zodat we u tijdens openingstijden kunnen terugbellen?", nextStep: "closed_intake_contact", context: { ...context, closedReason: userText } };
    }

    case "closed_intake_contact": {
      return {
        aiText: "Genoteerd. We nemen tijdens openingstijden contact met u op. Fijne dag verder.",
        nextStep: "confirmed",
        context: { ...context, closedContact: userText },
      };
    }

    default:
      return { aiText: "Dank u voor het gesprek. Tot ziens.", nextStep: "confirmed" };
  }
}

export { DEMO_SLOTS };
