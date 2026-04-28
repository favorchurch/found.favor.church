"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdmin } from "@/utils/admin";

const venueSchema = z.object({
  slug: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  parent_slug: z.string().min(1).max(50).nullable().optional(),
  display_order: z.number().int().optional(),
});

export async function getVenues() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("found_item_venues")
    .select("*")
    .order("display_order")
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
  const parentSlug = validatedData.parent_slug || null;

  if (parentSlug && parentSlug === validatedData.slug) {
    throw new Error("A venue cannot be its own parent");
  }

  if (parentSlug) {
    const { data: parent, error: parentError } = await supabase
      .from("found_item_venues")
      .select("slug, parent_slug")
      .eq("slug", parentSlug)
      .maybeSingle();

    if (parentError) throw parentError;
    if (!parent) {
      throw new Error("Parent venue not found");
    }
    if (parent.parent_slug) {
      throw new Error(
        "Venues only support one level of nesting; the chosen parent is itself a child venue.",
      );
    }

    const { count: childCount, error: childError } = await supabase
      .from("found_item_venues")
      .select("slug", { count: "exact", head: true })
      .eq("parent_slug", validatedData.slug);

    if (childError) throw childError;
    if (childCount && childCount > 0) {
      throw new Error(
        "This venue already has child venues, so it cannot become a child itself.",
      );
    }
  }

  const { error } = await supabase.from("found_item_venues").upsert({
    slug: validatedData.slug,
    name: validatedData.name,
    parent_slug: parentSlug,
    ...(validatedData.display_order !== undefined
      ? { display_order: validatedData.display_order }
      : {}),
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

  // Null out parent_slug on any children of the venue being deleted so they
  // become top-level rather than orphaned with a broken FK reference.
  // (The FK already has ON DELETE SET NULL, but doing it explicitly keeps the
  // intent obvious and lets us revalidate caches in one shot.)
  const { error: orphanError } = await supabase
    .from("found_item_venues")
    .update({ parent_slug: null })
    .eq("parent_slug", slug);

  if (orphanError) throw orphanError;

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
