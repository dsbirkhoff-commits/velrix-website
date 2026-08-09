/**
 * Step 2 of the connect flow: Google redirects here with a one-time `code`
 * after Daniel grants (or denies) access on Google's own consent screen.
 * This handler exchanges that code for tokens using the client secret
 * (server-side only) and shows the resulting refresh_token exactly once,
 * with instructions to paste it into Vercel by hand.
 *
 * Why not store it automatically? There is no database in this project
 * (by design — see /docs and prior commits). For a single-admin "connect
 * my own account" setup, a one-time manual copy into a Vercel environment
 * variable is simpler and just as secure as adding new infrastructure for
 * one secret. The token is never logged, never written to a file, and
 * never sent anywhere other than this one response.
 */
import crypto from "node:crypto";
import { getOAuthClient } from "../../_googleCalendar.js";

const MAX_STATE_AGE_MS = 10 * 60 * 1000; // 10 minutes

function isValidState(state) {
  if (!state || typeof state !== "string" || !state.includes(".")) return false;
  const [timestamp, signature] = state.split(".");
  if (!timestamp || !signature) return false;
  if (Date.now() - Number(timestamp) > MAX_STATE_AGE_MS) return false;

  const expected = crypto
    .createHmac("sha256", process.env.GOOGLE_CLIENT_SECRET || "")
    .update(timestamp)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false; // length mismatch etc.
  }
}

function page(title, bodyHtml) {
  return `<!doctype html>
<html lang="nl"><head><meta charset="utf-8"><title>${title}</title>
<style>
  body{background:#0a0b0d;color:#f3f1ec;font-family:ui-sans-serif,system-ui,sans-serif;max-width:640px;margin:80px auto;padding:0 20px;line-height:1.6;}
  h1{font-family:Georgia,serif;font-size:1.6rem;font-weight:500;}
  code{background:#15171b;border:1px solid #34383f;border-radius:6px;padding:2px 8px;color:#e6cd94;word-break:break-all;}
  .token-box{background:#15171b;border:1px solid #34383f;border-radius:12px;padding:18px;margin:20px 0;word-break:break-all;font-family:monospace;font-size:13px;color:#e6cd94;}
  .warn{color:#e6947a;font-size:14px;}
</style></head>
<body>${bodyHtml}</body></html>`;
}

export default async function handler(req, res) {
  const { code, state, error } = req.query || {};

  if (error) {
    res.status(400).send(page("Verbinding geweigerd", `<h1>Geannuleerd</h1><p>Google meldt: <code>${error}</code>. Er is niets opgeslagen.</p>`));
    return;
  }

  if (!isValidState(state)) {
    res.status(400).send(page("Ongeldige aanvraag", "<h1>Ongeldige of verlopen aanvraag</h1><p>Start de koppeling opnieuw via /admin/koppel-agenda.</p>"));
    return;
  }

  if (!code) {
    res.status(400).send(page("Ontbrekende code", "<h1>Geen autorisatiecode ontvangen</h1><p>Start de koppeling opnieuw.</p>"));
    return;
  }

  try {
    const oauth2Client = await getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      res.status(200).send(
        page(
          "Geen refresh token ontvangen",
          `<h1>Verbonden, maar geen nieuwe refresh token</h1>
           <p class="warn">Google geeft alleen bij de <strong>eerste</strong> toestemming een refresh token terug.
           Als je dit account al eerder had gekoppeld, moet je eerst de toegang intrekken en opnieuw beginnen.</p>
           <p>Ga naar <a href="https://myaccount.google.com/permissions" style="color:#e6cd94">myaccount.google.com/permissions</a>,
           zoek de VELRIX-app, klik "Toegang verwijderen", en start de koppeling daarna opnieuw.</p>`
        )
      );
      return;
    }

    res.status(200).send(
      page(
        "Google Agenda gekoppeld",
        `<h1>✓ Verbinding gelukt</h1>
         <p>Kopieer onderstaande waarde <strong>nu</strong> — hij wordt maar één keer getoond en nergens opgeslagen door VELRIX.</p>
         <div class="token-box">${tokens.refresh_token}</div>
         <p>Zet deze waarde in <strong>Vercel → Settings → Environment Variables</strong> als:</p>
         <p><code>GOOGLE_REFRESH_TOKEN</code> = de waarde hierboven</p>
         <p>Daarna opnieuw deployen (of "Redeploy" klikken in Vercel) zodat de nieuwe environment variable actief wordt.
         Vanaf dat moment gebruikt de boekingsflow op de website je echte agenda in plaats van testmodus.</p>
         <p class="warn">Sluit dit tabblad pas nadat je de waarde hebt gekopieerd.</p>`
      )
    );
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).send(page("Er ging iets mis", `<h1>Kon geen tokens ophalen</h1><p>${err.message || "Onbekende fout"}</p>`));
  }
}
