import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { subDays } from "date-fns";

export async function POST() {
  const supabase = await createClient();

  // Find items marked as 'claimed' or 'disposed' more than 1 month ago
  // Or simply 'claimed' items found more than 30 days ago as per user request
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString().split('T')[0];

  const { error } = await supabase
    .from("found_items")
    .update({ archived_at: new Date().toISOString() })
    .eq("status", "claimed")
    .lt("date_found", thirtyDaysAgo)
    .is("archived_at", null);

  if (error) {
    console.error("Error archiving items:", error.message);
  }

  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard?archived=success");
}
