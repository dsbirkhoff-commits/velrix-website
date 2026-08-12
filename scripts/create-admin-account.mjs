#!/usr/bin/env node
/**
 * SERVER-SIDE / ADMIN-ONLY. Never deployed, never a web route, never
 * reachable via any URL. Run this yourself, locally, from a terminal you
 * control. This is deliberately the ONLY way to bootstrap the very first
 * VELRIX portal account — there is no website page that can do this,
 * on purpose (see the chat this was requested in).
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/create-admin-account.mjs daniel@velrix.nl
 *
 * What it does:
 *   1. Generates a cryptographically random password (never typed by you,
 *      never chosen by anyone, never hardcoded anywhere in this repo).
 *   2. Creates the Supabase Auth user with that password (or, if the
 *      account already exists, resets its password instead — safe to
 *      re-run).
 *   3. Prints the password ONCE. Copy it now; it is not stored or logged
 *      anywhere else. Log in immediately and, if you'd rather not
 *      remember a random string, use "Wachtwoord vergeten" on
 *      /portal/login afterward to set your own.
 *
 * What it does NOT do: create an organization, a membership, or set
 * is_velrix_admin. Those remain deliberately SQL-only, run by hand via
 * the Supabase SQL Editor (see supabase/seed.sql /
 * supabase/seed_demo_garage.sql) — never automated, never exposed
 * through any code path a website visitor could reach.
 */
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];

if (!email) {
  console.error("Gebruik: node scripts/create-admin-account.mjs <email>");
  process.exit(1);
}
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY moeten als environment variables gezet zijn (alleen voor dit ene, lokale terminal-commando — nooit in Vercel voor dit script).");
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function generatePassword() {
  // 24 random bytes -> base64url, altijd sterk genoeg en nooit door een
  // mens bedacht of getypt.
  return randomBytes(24).toString("base64url");
}

async function findExistingUser(targetEmail) {
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase());
    if (found) return found;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

async function main() {
  const password = generatePassword();
  const existing = await findExistingUser(email);

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, { password });
    if (error) throw error;
    console.log(`Bestaand account gevonden (${email}) — wachtwoord gereset.`);
  } else {
    const { error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    console.log(`Nieuw account aangemaakt: ${email}`);
  }

  console.log("\nWachtwoord (kopieer dit nu, wordt nergens anders getoond of opgeslagen):");
  console.log(password);
  console.log("\nLog in op /portal/login. Wil je liever je eigen wachtwoord? Gebruik daarna 'Wachtwoord vergeten' op de loginpagina.");
}

main().catch((err) => {
  console.error("Fout:", err.message || err);
  process.exit(1);
});
