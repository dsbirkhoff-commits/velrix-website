/**
 * Client-side Supabase client (browser). Uses the public "anon" key —
 * safe to expose, since Row Level Security (see
 * /supabase/migrations/0001_init.sql) is what actually enforces which
 * rows a signed-in user can read or write, not this key. The anon key
 * alone grants no access to anything; it only identifies the project.
 *
 * Requires these Vercel/Vite environment variables (see README section
 * on Supabase setup):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 */
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ontbreken — het klantportaal (/login, /dashboard) kan niet werken totdat deze in Vercel zijn gezet. De publieke website en booking-flow zijn hier niet van afhankelijk."
  );
}

export const supabase = createClient(url || "https://placeholder.supabase.co", anonKey || "placeholder", {
  auth: {
    // FIX (sessieconflict-analyse): automatische, impliciete verwerking
    // van een URL-token gebeurt vóór React zelfs maar mount, en heeft
    // geen enkele controle over een reeds actieve sessie in dezelfde
    // browser. ResetPassword.jsx verwerkt de token nu zelf, expliciet,
    // met een gegarandeerde volgorde (bestaande sessie eerst beëindigen,
    // dan pas de nieuwe sessie instellen). Geen enkele andere plek in de
    // codebase leunt op automatische URL-tokendetectie (geverifieerd) —
    // veilig om hier uit te zetten.
    detectSessionInUrl: false,
  },
});
