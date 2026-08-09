/**
 * Server-side only. Creates a lead in the existing VELRIX Notion "Contacten"
 * database via Notion's public API — completely separate credential from
 * anything used elsewhere in this project (this is a real Notion internal
 * integration token, not related to Claude's own Notion access).
 *
 * Required environment variables:
 *   NOTION_API_KEY               internal integration token ("secret_...")
 *   NOTION_CONTACTS_DATABASE_ID  the Contacten database ID (share the
 *                                database with your integration first, or
 *                                this will fail with a 403/404)
 *
 * If either is missing, createLead() resolves with
 * { created:false, reason:"not_configured" } instead of throwing — the
 * contact form must keep working even without Notion configured.
 *
 * Property names below match the existing Contacten schema exactly
 * (Bedrijf, Contactpersoon, Email, Status, Bron, Notities,
 * "Datum eerste contact"). Status uses the emoji-prefixed option that is
 * actually configured on the live database ("🆕 Nieuw") rather than a
 * plain "Nieuw" string, so it matches an existing select option instead of
 * silently creating a near-duplicate one.
 */

const NOTION_VERSION = "2022-06-28";

export async function createLead({ bedrijf, contactpersoon, email, bericht }) {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_CONTACTS_DATABASE_ID;

  if (!apiKey || !databaseId) {
    return { created: false, reason: "not_configured" };
  }

  const today = new Date().toISOString().slice(0, 10);

  const body = {
    parent: { database_id: databaseId },
    properties: {
      Naam: { title: [{ text: { content: bedrijf || contactpersoon || "Nieuwe aanvraag via website" } }] },
      Bedrijf: { rich_text: [{ text: { content: bedrijf || "" } }] },
      Contactpersoon: { rich_text: [{ text: { content: contactpersoon || "" } }] },
      Email: { email: email || null },
      Status: { select: { name: "🆕 Nieuw" } },
      Bron: { select: { name: "Website" } },
      Notities: { rich_text: [{ text: { content: bericht || "" } }] },
      "Datum eerste contact": { date: { start: today } },
    },
  };

  try {
    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("Notion create lead error:", res.status, errBody);
      return { created: false, reason: "provider_error", status: res.status };
    }

    const data = await res.json();
    return { created: true, pageId: data.id, url: data.url };
  } catch (err) {
    console.error("createLead error:", err);
    return { created: false, reason: "network_error" };
  }
}
