/**
 * Pure booking logic, deliberately separated from the HTTP handler in
 * book.js so it can be unit-tested with a mock Google Calendar client —
 * no live Google credentials or network access required to verify the
 * double-booking rules.
 *
 * The critical guarantee: getBusyForDay() (the freebusy check) is called
 * again HERE, immediately before events.insert(), using the exact same
 * overlapsBusy() function that filters the availability list. The
 * frontend's list of "free" slots is never trusted on its own — this is
 * the actual gate.
 *
 * Residual limitation, stated plainly rather than overclaimed: this
 * narrows the race window from "however long the visitor had the booking
 * page open" down to the gap between this re-check and the insert call —
 * a single request's round-trip, typically well under a second. It does
 * not make the check-then-insert sequence fully atomic, because the
 * Google Calendar API has no compare-and-swap / conditional-insert
 * primitive to build true atomicity on top of. True atomicity would need
 * an external lock (e.g. a database row lock) around the whole
 * check+insert sequence — out of scope here since this project has no
 * database by design. In practice, two people would need to submit within
 * the same fraction of a second for the residual window to matter.
 */
import { MEETING_DURATION_MIN, overlapsBusy, getBusyForDay, zonedWallTimeToUtcDate, addMinutesToWallTime } from "./_googleCalendar.js";

export async function attemptBooking({ calendar, calendarId, timeZone, dateISO, time, name, email }) {
  // Real instants — needed only to compare against Google's busy[] (which
  // are real instants). NOT what gets sent to Google for event creation.
  const start = zonedWallTimeToUtcDate(dateISO, time, timeZone);
  const endWall = addMinutesToWallTime(dateISO, time, MEETING_DURATION_MIN);
  const end = zonedWallTimeToUtcDate(endWall.dateISO, endWall.time, timeZone);

  let busy;
  try {
    busy = await getBusyForDay(calendar, calendarId, timeZone, dateISO);
  } catch (err) {
    const wrapped = new Error("calendar_unreachable");
    wrapped.cause = err;
    throw wrapped;
  }

  if (overlapsBusy(start, end, busy)) {
    return { status: "slot_taken" };
  }

  const event = await calendar.events.insert({
    calendarId,
    sendUpdates: "all",
    requestBody: {
      summary: `VELRIX kennismaking — ${name}`,
      description: "Gratis kennismaking (30 min) via velrix.nl",
      // Floating local wall-clock time (no Z / no offset) + explicit
      // timeZone — the documented, DST-correct way to tell Google
      // Calendar "this clock time, in this zone". Google's own servers
      // resolve the real instant, so no manual DST math is needed or
      // wanted here.
      start: { dateTime: `${dateISO}T${time}:00`, timeZone },
      end: { dateTime: `${endWall.dateISO}T${endWall.time}:00`, timeZone },
      attendees: [{ email, displayName: name }],
    },
  });

  return { status: "booked", eventId: event.data.id, htmlLink: event.data.htmlLink };
}
