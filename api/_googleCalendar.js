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
