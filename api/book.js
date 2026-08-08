import { isConfigured, getTimezone, getCalendarClient } from "./_googleCalendar.js";

const MEETING_DURATION_MIN = 30;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { dateISO, time, name, email, phone } = req.body || {};

  if (!dateISO || !time || !name || !email) {
    res.status(400).json({ error: "dateISO, time, name en email zijn verplicht." });
    return;
  }

  if (!isConfigured()) {
    // Expected state until GOOGLE_CALENDAR_* env vars are set in Vercel.
    res.status(501).json({
      success: false,
      configured: false,
      message: "Google Calendar is nog niet gekoppeld. Er is geen echte afspraak aangemaakt.",
    });
    return;
  }

  try {
    const calendar = await getCalendarClient();
    const timeZone = getTimezone();

    const start = new Date(`${dateISO}T${time}:00`);
    const end = new Date(start.getTime() + MEETING_DURATION_MIN * 60000);

    const event = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      sendUpdates: "all",
      requestBody: {
        summary: `Gratis kennismaking — ${name} (VELRIX)`,
        description: [
          "Gratis kennismaking (30 min) via velrix.nl",
          phone ? `Telefoon: ${phone}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
        start: { dateTime: start.toISOString(), timeZone },
        end: { dateTime: end.toISOString(), timeZone },
        attendees: [{ email, displayName: name }],
      },
    });

    res.status(200).json({
      success: true,
      source: "google-calendar",
      eventId: event.data.id,
      htmlLink: event.data.htmlLink,
    });
  } catch (err) {
    console.error("booking error:", err);
    res.status(500).json({ success: false, error: "Kon de afspraak niet aanmaken in Google Calendar." });
  }
}
