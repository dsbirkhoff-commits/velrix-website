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
  // Real instants — needed to compare against Google's busy[] (which are
  // real instants), AND now used directly as the event's dateTime too
  // (see below) so there is exactly one source of truth for "what real
  // moment does this wall-clock time correspond to", not two techniques
  // that could theoretically disagree.
  const start = zonedWallTimeToUtcDate(dateISO, time, timeZone);
  const endWall = addMinutesToWallTime(dateISO, time, MEETING_DURATION_MIN);
  const end = zonedWallTimeToUtcDate(endWall.dateISO, endWall.time, timeZone);

  // Required debug logging (temporary, see task): proves exactly what
  // this request selected and what gets sent to Google, visible in
  // Vercel's function logs for the next live test.
  console.log("SELECTED DATE:", dateISO);
  console.log("SELECTED TIME:", time);
  console.log("TIMEZONE:", timeZone);
  console.log("CALENDAR START:", `${dateISO}T${time}:00`, "| resolved UTC instant:", start.toISOString());
  console.log("CALENDAR END:", `${endWall.dateISO}T${endWall.time}:00`, "| resolved UTC instant:", end.toISOString());

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
      // Sent as an unambiguous, already-resolved real UTC instant (via
      // the same DST-aware zonedWallTimeToUtcDate() used for the overlap
      // check — one conversion, used twice, rather than trusting Google
      // to correctly interpret a floating local time on top of that).
      // timeZone is still included so Google displays/handles the event
      // in the right zone (e.g. for recurrence, if ever added later).
      start: { dateTime: start.toISOString(), timeZone },
      end: { dateTime: end.toISOString(), timeZone },
      attendees: [{ email, displayName: name }],
    },
  });

  return { status: "booked", eventId: event.data.id, htmlLink: event.data.htmlLink };
}
