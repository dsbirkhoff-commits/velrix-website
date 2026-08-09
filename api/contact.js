/**
 * POST /api/contact — the real server-side handler behind the "Verstuur
 * aanvraag" button on the website. Never exposes any secret to the
 * browser: RESEND_API_KEY / NOTION_API_KEY only ever live in this file's
 * process.env, read server-side on Vercel.
 *
 * Flow: validate + sanitize → honeypot/rate-limit check → send email
 * (always attempted) → create Notion lead (best-effort, optional) →
 * respond. If email fails AND Notion isn't configured/fails, the request
 * genuinely wasn't captured anywhere, so this responds with an error
 * rather than a false "success".
 */
import { sendEmail } from "./_email.js";
import { createLead } from "./_notionLead.js";

const MAX_LEN = { naam: 100, email: 200, bedrijf: 150, bericht: 4000, telefoon: 40 };

// Best-effort in-memory rate limiting. Serverless functions don't share
// memory across cold instances, so this isn't a hard guarantee — it's a
// simple deterrent against basic spam scripts, as requested ("eenvoudige
// rate limiting"). For stronger protection, add Vercel's Firewall or a
// KV-backed limiter later.
const recentSubmissions = new Map(); // ip -> [timestamps]
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

function isRateLimited(ip) {
  const now = Date.now();
  const history = (recentSubmissions.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  history.push(now);
  recentSubmissions.set(ip, history);
  return history.length > RATE_LIMIT_MAX;
}

function sanitize(value, maxLen) {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "") // strip any HTML tags
    .replace(/[\r\n]{3,}/g, "\n\n") // collapse excessive newlines
    .trim()
    .slice(0, maxLen);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const ip = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
  if (isRateLimited(ip)) {
    res.status(429).json({ error: "Te veel aanvragen. Probeer het over een paar minuten opnieuw." });
    return;
  }

  const body = req.body || {};

  // Honeypot: a hidden field named "website" that real visitors never
  // fill in. Bots that auto-fill every field will trip it. Respond as if
  // successful so bots don't learn to avoid the trap, but do nothing.
  if (body.website) {
    res.status(200).json({ success: true });
    return;
  }

  const naam = sanitize(body.naam, MAX_LEN.naam);
  const email = sanitize(body.email, MAX_LEN.email);
  const bedrijf = sanitize(body.bedrijf, MAX_LEN.bedrijf);
  const bericht = sanitize(body.bericht, MAX_LEN.bericht);
  const telefoon = sanitize(body.telefoon, MAX_LEN.telefoon);

  if (!naam || !email || !bericht) {
    res.status(400).json({ error: "Naam, e-mailadres en bericht zijn verplicht." });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Vul een geldig e-mailadres in." });
    return;
  }

  const now = new Date();
  const dateLabel = now.toLocaleString("nl-NL", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Amsterdam" });

  const subject = `Nieuwe VELRIX aanvraag — ${bedrijf || naam}`;
  const text = [
    "Nieuwe aanvraag via velrix.nl",
    "",
    `Naam: ${naam}`,
    `E-mailadres: ${email}`,
    telefoon ? `Telefoonnummer: ${telefoon}` : null,
    `Garage: ${bedrijf || "-"}`,
    `Bericht: ${bericht}`,
    `Datum/tijd: ${dateLabel}`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family:sans-serif;line-height:1.6;color:#111;">
      <h2 style="margin:0 0 16px;">Nieuwe aanvraag via velrix.nl</h2>
      <p><strong>Naam:</strong> ${escapeHtml(naam)}</p>
      <p><strong>E-mailadres:</strong> ${escapeHtml(email)}</p>
      ${telefoon ? `<p><strong>Telefoonnummer:</strong> ${escapeHtml(telefoon)}</p>` : ""}
      <p><strong>Garage:</strong> ${escapeHtml(bedrijf || "-")}</p>
      <p><strong>Bericht:</strong><br>${escapeHtml(bericht).replace(/\n/g, "<br>")}</p>
      <p style="color:#666;font-size:13px;"><strong>Datum/tijd:</strong> ${dateLabel}</p>
    </div>`;

  const emailResult = await sendEmail({ to: "daniel@velrix.nl", subject, html, text });

  const leadResult = await createLead({ bedrijf, contactpersoon: naam, email, bericht });

  if (!emailResult.sent && !leadResult.created) {
    // Nothing actually captured anywhere — be honest with the visitor
    // instead of showing a false success message.
    res.status(502).json({
      error: "Kon de aanvraag nergens opslaan. Mail rechtstreeks naar daniel@velrix.nl.",
      email: emailResult,
      lead: leadResult,
    });
    return;
  }

  res.status(200).json({
    success: true,
    email: emailResult.sent ? "sent" : emailResult.reason,
    lead: leadResult.created ? "created" : leadResult.reason,
  });
}
