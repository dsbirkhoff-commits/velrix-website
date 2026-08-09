/**
 * Server-side only. Modular email service — swap the implementation below
 * to change providers without touching contact.js or any frontend code.
 *
 * Default provider: Resend (https://resend.com) — simple REST API, no SDK
 * dependency needed (plain fetch), generous free tier, works well on
 * Vercel serverless functions.
 *
 * Required environment variable:
 *   RESEND_API_KEY     from resend.com → API Keys
 *
 * Optional:
 *   CONTACT_FROM_EMAIL  the "from" address. Until you verify velrix.nl as a
 *                        sending domain in Resend, use their shared test
 *                        domain, e.g. "VELRIX <onboarding@resend.dev>".
 *                        Defaults to that if not set.
 *
 * If RESEND_API_KEY is missing, sendEmail() resolves with
 * { sent:false, reason:"not_configured" } instead of throwing — callers
 * decide what that means for the overall request (see contact.js).
 */

const DEFAULT_FROM = "VELRIX <onboarding@resend.dev>";

export async function sendEmail({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, reason: "not_configured" };
  }

  const from = process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, html, text }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("Resend error:", res.status, body);
      return { sent: false, reason: "provider_error", status: res.status };
    }

    const data = await res.json();
    return { sent: true, id: data.id };
  } catch (err) {
    console.error("sendEmail error:", err);
    return { sent: false, reason: "network_error" };
  }
}
