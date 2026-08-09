# VELRIX Voice AI — van gratis demo naar productie

Dit document beschrijft hoe de huidige, gratis browser-demo (`/voice-demo`)
later uitgebreid kan worden naar een echte telefonische AI-receptionist,
zonder de bestaande architectuur weg te gooien.

## Huidige situatie (deze commit)

```
Browser (Web Speech API)
   ↓ spraak → tekst (SpeechRecognition, gratis, browser-native)
voiceEngine.js — nextTurn()  (regelgebaseerd, GEEN taalmodel)
   ↓ tekst → spraak (speechSynthesis, gratis, browser-native)
Browser spreekt antwoord uit
```

Kosten: **€0**. Geen API-keys, geen backend-aanroepen, geen secrets.

## Toekomstige productie-architectuur

```
Telefoonnummer
   ↓
Twilio (of andere SIP-provider) — neemt het gesprek aan
   ↓
Realtime Voice AI (bv. een STT/LLM/TTS-pipeline, of een all-in-one
   realtime voice-API)
   ↓
VELRIX backend (bestaande /api-laag, zie /api/_googleCalendar.js)
   ↓
Google Calendar — echte agenda-koppeling (architectuur staat al klaar,
   zie calendarService.js en /api/availability.js, /api/book.js)
   ↓
n8n — automatisering или nabewerking (follow-up mail, CRM-sync)
   ↓
CRM (het VELRIX-systeem in Notion)
   ↓
WhatsApp / e-mail — bevestiging naar de klant
```

## Wat blijft hetzelfde

`voiceEngine.js` exporteert één functie met een stabiele interface:

```js
nextTurn({ step, context, userText }) => { aiText, nextStep, context, showSlots, demoBooking }
```

De UI (`VoiceDemo.jsx`) roept alleen deze functie aan — hij weet niets over
hóe het antwoord tot stand komt. Dat betekent: de *implementatie* van
`nextTurn()` kan later vervangen worden door een aanroep naar een echt
taalmodel (via een `/api/voice-turn` serverless function, zodat de API-key
server-side blijft), zonder dat er iets aan `VoiceDemo.jsx` hoeft te
veranderen.

## Wat nodig is per stap

| Stap | Wat | Kost geld? |
|---|---|---|
| Telefoonnummer | Twilio-nummer (of vergelijkbaar) | Ja — maandelijks + per-minuut |
| Spraakherkenning (telefoonkwaliteit) | Een STT-API (Twilio's ingebouwde, of Deepgram/Google) | Ja — meestal per minuut |
| Taalbegrip | Een LLM-API (bv. Anthropic of OpenAI) i.p.v. het huidige regelsysteem | Ja — per token/gesprek |
| Spraaksynthese (telefoonkwaliteit) | Een TTS-API (Twilio's ingebouwde, of ElevenLabs) | Ja — meestal per teken/minuut |
| Agenda-koppeling | Al gebouwd — zie `calendarService.js` + `/api/availability.js` + `/api/book.js` | Nee (Google Calendar API zelf is gratis binnen normale quota) |
| CRM | Al gebouwd — het VELRIX-systeem in Notion | Nee (bestaand Notion-abonnement) |
| WhatsApp/e-mail | WhatsApp Business API of een e-mail-API (bv. Resend) | Meestal ja, afhankelijk van volume |
| n8n | Self-hosted (gratis) of n8n Cloud (betaald) | Optioneel |

Niets hiervan is in deze commit geactiveerd of geconfigureerd — dit is
uitsluitend documentatie voor een later gesprek over budget en
leveranciers.
