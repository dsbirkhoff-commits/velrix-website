/**
 * Server-side only. Never imported by any file under /src — this file (and
 * the credentials it reads) must never reach the browser bundle.
 *
 * Auth model: OAuth 2.0 (Authorization Code flow), authorized once by the
 * calendar owner via /api/auth/google/start — NOT a service account, and
 * VELRIX never sees the owner's Google password. See
 * /api/auth/google/{start,callback}.js for the one-time connection flow.
 *
 * Required environment variables (Vercel → Settings → Environment
 * Variables, never in the frontend):
 *
 *   GOOGLE_CLIENT_ID       from the OAuth client in Google Cloud Console
 *   GOOGLE_CLIENT_SECRET   from the OAuth client in Google Cloud Console
 *   GOOGLE_REDIRECT_URI    e.g. https://velrix.nl/api/auth/google/callback
 *                          (must exactly match what's registered in Google
 *                          Cloud Console)
 *   GOOGLE_REFRESH_TOKEN   obtained once via the connect flow below, then
 *                          pasted into Vercel by hand (see callback.js)
 *   GOOGLE_CALENDAR_ID     optional, defaults to "primary" (the owner's
 *                          main calendar)
 *   GOOGLE_CALENDAR_TIMEZONE  optional, defaults to "Europe/Amsterdam"
 *   ADMIN_SETUP_SECRET     a value you choose yourself; required as
 *                          ?key=... on /admin/koppel-agenda so a random
 *                          visitor can't trigger the connect flow
 *
 * Until CLIENT_ID + CLIENT_SECRET + REFRESH_TOKEN are all present,
 * isConfigured() returns false and both booking API routes respond with
 * 501 so the frontend cleanly falls back to its Testmodus provider — no
 * silent fake bookings.
 */

export function isConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN
  );
}

export function getTimezone() {
  return process.env.GOOGLE_CALENDAR_TIMEZONE || "Europe/Amsterdam";
}

export function getCalendarId() {
  return process.env.GOOGLE_CALENDAR_ID || "primary";
}

export async function getOAuthClient() {
  // Shared by start.js, callback.js and the calendar client below, so the
  // redirect URI is defined in exactly one place.
  const { google } = await import("googleapis");
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

/**
 * Lazily creates an authenticated Google Calendar client using the stored
 * refresh token. The googleapis client library automatically exchanges it
 * for a short-lived access token as needed — no manual refresh logic here.
 */
export async function getCalendarClient() {
  const { google } = await import("googleapis");

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

/**
 * Shared booking-rules constants and the ONE overlap check used by both
 * availability.js (to decide which slots to show) and book.js (to make
 * the final, authoritative decision right before creating the event).
 * Keeping this in a single function is deliberate: two separate
 * hand-written overlap checks are exactly how these subtly drift apart
 * and disagree with each other over time.
 */
export const MEETING_DURATION_MIN = 30;
export const BUFFER_MIN = 15; // gap required between the end of one meeting and the start of the next

/**
 * True if [newStart, newEnd) is too close to any busy interval, once each
 * busy interval is padded by BUFFER_MIN on both sides. Real interval
 * overlap (newStart < paddedBusyEnd && newEnd > paddedBusyStart), not a
 * same-day-only or start-time-only check.
 */
export function overlapsBusy(newStart, newEnd, busyIntervals, bufferMin = BUFFER_MIN) {
  return busyIntervals.some((b) => {
    const busyStart = new Date(new Date(b.start).getTime() - bufferMin * 60000);
    const busyEnd = new Date(new Date(b.end).getTime() + bufferMin * 60000);
    return newStart < busyEnd && newEnd > busyStart;
  });
}

/**
 * THE TIMEZONE FIX.
 *
 * Root cause of the reported bug: `new Date("2026-08-20T10:00:00")` (no
 * offset suffix) is parsed as local time IN WHATEVER TIMEZONE THE NODE
 * PROCESS IS RUNNING IN — on Vercel, that's UTC, not Europe/Amsterdam.
 * Calling `.toISOString()` on that then emits a "Z" (UTC) instant that is
 * simply wrong by the current Amsterdam/UTC offset (+1h in winter, +2h in
 * summer — which is exactly the "+2 hours" symptom that was reported).
 * Google Calendar honors an explicit offset/Z in `dateTime` as the actual
 * instant and treats the accompanying `timeZone` field as informational
 * only, so the event landed at the wrong real-world moment even though
 * `timeZone: "Europe/Amsterdam"` was present.
 *
 * Two distinct fixes below, for two distinct needs — never a hardcoded
 * +1/+2 offset anywhere:
 *
 * 1. zonedWallTimeToUtcDate() — for anywhere we need a real, comparable
 *    Date *instant* (freebusy day-boundary queries, overlap comparisons
 *    against Google's returned busy[], which are real instants). Uses the
 *    Intl "double formatting" technique to ask the JS engine's own IANA
 *    timezone database what Europe/Amsterdam's UTC offset actually is at
 *    the relevant moment — correct across DST automatically, because it's
 *    the same tz database every `Intl`/`Date` implementation already
 *    ships with.
 *
 * 2. For the event actually sent to Google (start.dateTime/end.dateTime),
 *    see _booking.js: we deliberately do NOT convert to a UTC instant at
 *    all. We send a *floating* local time string (no Z, no offset) plus
 *    an explicit `timeZone` field — which is Google Calendar API's own
 *    documented way to say "this wall-clock time, in this zone", letting
 *    Google's own servers do the DST-correct interpretation. This is the
 *    simplest possible correct fix for the actual booking bug.
 */
export function zonedWallTimeToUtcDate(dateISO, timeHHMM, timeZone) {
  const [year, month, day] = dateISO.split("-").map(Number);
  const [hour, minute] = timeHHMM.split(":").map(Number);

  // Step 1: naive guess — treat the wall-clock numbers as if they were UTC.
  const naiveUtcGuess = Date.UTC(year, month - 1, day, hour, minute, 0, 0);

  // Step 2: ask the IANA tz database (via Intl) what Europe/Amsterdam's
  // clock reads AT that guessed instant.
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(dtf.formatToParts(new Date(naiveUtcGuess)).map((p) => [p.type, p.value]));
  const zonedReadingOfGuess = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second)
  );

  // Step 3: the difference between what Amsterdam reads and our guess IS
  // the real current UTC offset (e.g. +2h in summer, +1h in winter) —
  // looked up, never hardcoded. Subtract it to get the true UTC instant.
  const offsetMs = zonedReadingOfGuess - naiveUtcGuess;
  return new Date(naiveUtcGuess - offsetMs);
}

/**
 * Pure wall-clock arithmetic (e.g. "what's 30 minutes after 10:00?" ->
 * "10:30", or "23:45 + 30 min" -> next day "00:15"). Deliberately uses a
 * UTC-anchored scratch Date purely as a calculator, read back only via
 * getUTC*() — this never touches real-world timezone conversion, so it
 * can't reintroduce the DST bug. Used to compute event end times as a
 * floating wall-clock string, matching how the start time is expressed.
 */
export function addMinutesToWallTime(dateISO, timeHHMM, minutes) {
  const [year, month, day] = dateISO.split("-").map(Number);
  const [hour, minute] = timeHHMM.split(":").map(Number);
  const scratch = new Date(Date.UTC(year, month - 1, day, hour, minute + minutes, 0));
  const pad = (n) => String(n).padStart(2, "0");
  return {
    dateISO: `${scratch.getUTCFullYear()}-${pad(scratch.getUTCMonth() + 1)}-${pad(scratch.getUTCDate())}`,
    time: `${pad(scratch.getUTCHours())}:${pad(scratch.getUTCMinutes())}`,
  };
}

/** Fetches the day's busy intervals from Google Calendar via freebusy.query. */
export async function getBusyForDay(calendar, calendarId, timeZone, dateISO) {
  const dayStart = zonedWallTimeToUtcDate(dateISO, "00:00", timeZone);
  const dayEnd = zonedWallTimeToUtcDate(dateISO, "23:59", timeZone);

  const freebusy = await calendar.freebusy.query({
    requestBody: {
      timeMin: dayStart.toISOString(),
      timeMax: dayEnd.toISOString(),
      timeZone,
      items: [{ id: calendarId }],
    },
  });

  return freebusy.data.calendars?.[calendarId]?.busy || [];
}
