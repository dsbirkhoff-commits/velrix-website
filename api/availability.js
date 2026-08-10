import { isConfigured, getTimezone, getCalendarClient, getCalendarId, getBusyForDay, overlapsBusy, MEETING_DURATION_MIN } from "./_googleCalendar.js";

const BUSINESS_HOURS = { startHour: 9, endHour: 17 };
const SLOT_STEP_MIN = 15; // 15-min granularity so buffer-shifted slots (e.g. 10:45 after a 10:00-10:30 meeting + 15-min buffer) can actually be offered

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const date = (req.query?.date || "").toString();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: "Query param 'date' must be YYYY-MM-DD" });
    return;
  }

  if (!isConfigured()) {
    // Expected state until GOOGLE_CALENDAR_* env vars are set in Vercel.
    // The frontend treats this as "use the mock provider", not an error.
    res.status(501).json({
      configured: false,
      message: "Google Calendar is nog niet gekoppeld. De website gebruikt tijdelijk voorbeeldbeschikbaarheid.",
    });
    return;
  }

  try {
    const calendar = await getCalendarClient();
    const timeZone = getTimezone();
    const calendarId = getCalendarId();

    const busy = await getBusyForDay(calendar, calendarId, timeZone, date);

    // Same overlap+buffer rule used by book.js's final re-check — one
    // implementation, so the list shown here and the check that actually
    // gates booking can never silently disagree.
    const slots = [];
    for (let h = BUSINESS_HOURS.startHour; h < BUSINESS_HOURS.endHour; h++) {
      for (let m = 0; m < 60; m += SLOT_STEP_MIN) {
        const slotStart = new Date(`${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
        const slotEnd = new Date(slotStart.getTime() + MEETING_DURATION_MIN * 60000);

        if (!overlapsBusy(slotStart, slotEnd, busy) && slotStart > new Date()) {
          slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
        }
      }
    }

    res.status(200).json({ configured: true, source: "google-calendar", date, slots });
  } catch (err) {
    console.error("availability error:", err);
    res.status(500).json({ configured: true, error: "Kon beschikbaarheid niet ophalen uit Google Calendar." });
  }
}
