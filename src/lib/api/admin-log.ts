import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";

export async function logAdminAction(
  supabase: SupabaseClient<Database>,
  userId: string,
  action: string,
  detail: Json
) {
  await supabase.from("admin_logs").insert({
    user_id: userId,
    action,
    detail,
  });
}
