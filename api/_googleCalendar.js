/**
 * Server-side only. Never imported by any file under /src — this file (and
 * the credentials it reads) must never reach the browser bundle.
 *
 * Required environment variables (set these in Vercel → Settings →
 * Environment Variables, not in the frontend):
 *
 *   GOOGLE_CALENDAR_ID                 e.g. "you@velrix.nl" or a calendar ID
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL       from the service account JSON
 *   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY from the service account JSON
 *                                      (keep the \n line breaks escaped as
 *                                      literal "\n" — Vercel env vars are
 *                                      single-line; this file un-escapes them)
 *   GOOGLE_CALENDAR_TIMEZONE           optional, defaults to "Europe/Amsterdam"
 *
 * Until all three required vars are present, isConfigured() returns false
 * and both API routes respond with 501 so the frontend cleanly falls back
 * to its mock provider — no silent fake bookings.
 */

export function isConfigured() {
  return Boolean(
    process.env.GOOGLE_CALENDAR_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  );
}

export function getTimezone() {
  return process.env.GOOGLE_CALENDAR_TIMEZONE || "Europe/Amsterdam";
}

/**
 * Lazily creates an authenticated Google Calendar client.
 * Uses the `googleapis` package with a service account (JWT) grant.
 *
 * NOTE: this has not been exercised against a real Google Cloud project yet
 * (no credentials exist at the time of writing). The shape follows Google's
 * documented service-account + Calendar API v3 flow exactly; treat this as
 * ready-to-test rather than battle-tested. Share the calendar itself with
 * the service account's email address ("Make changes to events") or writes
 * will fail with a 403 even once credentials are valid.
 */
export async function getCalendarClient() {
  const { google } = await import("googleapis");

  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return google.calendar({ version: "v3", auth });
}
