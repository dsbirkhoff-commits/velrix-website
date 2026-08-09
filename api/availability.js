import { isConfigured, getTimezone, getCalendarClient, getCalendarId } from "./_googleCalendar.js";

const BUSINESS_HOURS = { startHour: 9, endHour: 17 };
const SLOT_STEP_MIN = 30;
const MEETING_DURATION_MIN = 30;

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

    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59`);

    const freebusy = await calendar.freebusy.query({
      requestBody: {
        timeMin: dayStart.toISOString(),
        timeMax: dayEnd.toISOString(),
        timeZone,
        items: [{ id: calendarId }],
      },
    });

    const busy = freebusy.data.calendars?.[calendarId]?.busy || [];

    const slots = [];
    for (let h = BUSINESS_HOURS.startHour; h < BUSINESS_HOURS.endHour; h++) {
      for (let m = 0; m < 60; m += SLOT_STEP_MIN) {
        const slotStart = new Date(`${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
        const slotEnd = new Date(slotStart.getTime() + MEETING_DURATION_MIN * 60000);

        const overlaps = busy.some((b) => {
          const busyStart = new Date(b.start);
          const busyEnd = new Date(b.end);
          return slotStart < busyEnd && slotEnd > busyStart;
        });

        if (!overlaps && slotStart > new Date()) {
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
