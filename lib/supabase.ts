import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Check if email has active Pro subscription
export async function isProUser(email: string): Promise<boolean> {
  if (!email) return false;

  const { data, error } = await supabase
    .from("subscribers")
    .select("id, status, expires_at")
    .eq("email", email.toLowerCase())
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !data) return false;
  return true;
}
