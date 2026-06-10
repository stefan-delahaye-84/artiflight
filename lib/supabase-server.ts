import { createClient } from "@supabase/supabase-js";

// Uses service_role key — bypasses RLS. Only call from server-side code.
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
