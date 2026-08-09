/**
 * Step 1 of the connect flow: builds the Google consent-screen URL and
 * redirects the browser there. Only reachable with the correct
 * ADMIN_SETUP_SECRET, so a random visitor who finds this URL can't kick
 * off the flow (they'd still need Daniel's own Google login to do
 * anything useful with it, but this keeps things tidy).
 *
 * CSRF protection without a database: the "state" value sent to Google is
 * an HMAC-SHA256 signature (keyed with GOOGLE_CLIENT_SECRET, which only
 * this server knows) over a short-lived timestamp. callback.js recomputes
 * and compares it — no session storage needed for a single-admin flow.
 */
import crypto from "node:crypto";
import { getOAuthClient } from "../../_googleCalendar.js";

function signState() {
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", process.env.GOOGLE_CLIENT_SECRET || "")
    .update(timestamp)
    .digest("hex");
  return `${timestamp}.${signature}`;
}

export default async function handler(req, res) {
  const providedKey = req.query?.key;
  if (!process.env.ADMIN_SETUP_SECRET || providedKey !== process.env.ADMIN_SETUP_SECRET) {
    res.status(403).send("Niet geautoriseerd. Ontbrekende of onjuiste ?key=.");
    return;
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
    res
      .status(500)
      .send("GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET en GOOGLE_REDIRECT_URI moeten eerst in Vercel gezet zijn.");
    return;
  }

  const oauth2Client = await getOAuthClient();

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline", // required to receive a refresh_token
    prompt: "consent", // forces Google to re-issue a refresh_token even on reconnect
    scope: ["https://www.googleapis.com/auth/calendar"],
    state: signState(),
  });

  res.writeHead(302, { Location: url });
  res.end();
}
