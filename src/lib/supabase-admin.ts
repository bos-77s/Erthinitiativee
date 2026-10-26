
import { createClient } from "@supabase/supabase-js";

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secretKey) {
    throw new Error("Supabase server environment variables are missing.");
  }

  return { url, secretKey };
}

export function createSupabaseAdmin() {
  const { url, secretKey } = getSupabaseConfig();

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
