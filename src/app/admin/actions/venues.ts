"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdmin } from "@/utils/admin";

const venueSchema = z.object({
  slug: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
});

export async function getVenues() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("found_item_venues")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
}

export async function upsertVenue(data: z.infer<typeof venueSchema>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    throw new Error("Unauthorized");
  }

  const validatedData = venueSchema.parse(data);

  const { error } = await supabase.from("found_item_venues").upsert({
    ...validatedData,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("Venue slug already exists");
    }
    throw error;
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/dashboard");
  revalidatePath("/catalog");
  return { success: true };
}

export async function deleteVenue(slug: string, reassignToSlug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    throw new Error("Unauthorized");
  }

  if (slug === reassignToSlug) {
    throw new Error("Cannot reassign to the same venue");
  }

  const { count } = await supabase
    .from("found_item_venues")
    .select("*", { count: "exact", head: true });

  if (count && count <= 1) {
    throw new Error("Cannot delete the last remaining venue");
  }

  const { error: updateError } = await supabase
    .from("found_items")
    .update({ venue: reassignToSlug })
    .eq("venue", slug);

  if (updateError) throw updateError;

  const { error: deleteError } = await supabase
    .from("found_item_venues")
    .delete()
    .eq("slug", slug);

  if (deleteError) throw deleteError;

  revalidatePath("/admin/settings");
  revalidatePath("/admin/dashboard");
  revalidatePath("/catalog");
  return { success: true };
}
