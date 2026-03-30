import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy initialization — only create client when actually needed (not at build time)
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set");
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// Check if email has active Pro subscription
export async function isProUser(email: string): Promise<boolean> {
  if (!email) return false;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("subscribers")
      .select("id, status, expires_at")
      .eq("email", email.toLowerCase())
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !data) return false;
    return true;
  } catch {
    return false;
  }
}
