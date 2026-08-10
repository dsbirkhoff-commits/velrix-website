import { isConfigured, getTimezone, getCalendarClient, getCalendarId } from "./_googleCalendar.js";
import { attemptBooking } from "./_booking.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { dateISO, time, name, email } = req.body || {};

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
    const calendarId = getCalendarId();

    const result = await attemptBooking({ calendar, calendarId, timeZone, dateISO, time, name, email });

    if (result.status === "slot_taken") {
      // Someone else booked this exact slot between the frontend loading
      // availability and this request arriving. No event was created.
      res.status(409).json({
        success: false,
        reason: "slot_taken",
        message: "Dit tijdstip is zojuist geboekt. Kies een ander beschikbaar tijdstip.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      source: "google-calendar",
      eventId: result.eventId,
      htmlLink: result.htmlLink,
    });
  } catch (err) {
    if (err.message === "calendar_unreachable") {
      // Never confirm a booking we couldn't actually verify availability for.
      console.error("booking error (calendar unreachable):", err.cause || err);
      res.status(503).json({
        success: false,
        reason: "unreachable",
        message: "Het lukt momenteel niet om de beschikbaarheid te controleren. Probeer het over een moment opnieuw.",
      });
      return;
    }
    console.error("booking error:", err);
    res.status(500).json({ success: false, error: "Kon de afspraak niet aanmaken in Google Calendar." });
  }
}
