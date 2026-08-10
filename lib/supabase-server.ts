import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// This app has no generated Database types (no `supabase gen types` step in
// the free-tier setup), so the client is untyped on purpose — every table
// query result is treated as `any` and cast to the shapes in lib/types.ts.
let client: SupabaseClient | null = null;

/**
 * Server-only Supabase client using the service role key. Never import this
 * from a Client Component — it bypasses Row Level Security entirely, which is
 * why all reads/writes for this no-login app are routed through server code.
 */
export function supabaseServer(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false },
  });
  return client;
}

export const SHELF_PHOTOS_BUCKET = "shelf-photos";
