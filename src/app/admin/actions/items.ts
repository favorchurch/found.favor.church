"use server";

import { getAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const itemSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  date_found: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  location: z.string().nullable().optional(),
  venue: z.string().nullable().optional(),
  status: z.enum(["unclaimed", "claimed", "disposed"]),
  category: z.string().min(1).default("others"),
  is_public: z.boolean().default(false),
  photo_path: z.string().nullable().optional(),
  claimed_date: z.string().nullable().optional(),
  claimed_by: z.string().nullable().optional(),
  disposed_date: z.string().nullable().optional(),
  disposed_by: z.string().nullable().optional(),
});

interface FoundItemUpdate {
  name: string;
  description?: string | null;
  date_found: string;
  location?: string | null;
  venue?: string | null;
  status: "unclaimed" | "claimed" | "disposed";
  category: string;
  is_public: boolean;
  photo_path?: string | null;
  updated_at: string;
  updated_by: null;
  updated_by_email: string;
  created_by?: null;
  created_by_email?: string;
  claimed_date?: string | null;
  claimed_by?: string | null;
  disposed_date?: string | null;
  disposed_by?: string | null;
}

/**
 * Creates a new found item entry or updates an existing one.
 * Requires an active MNL Staff member with a verified Auth0 email. Audit columns store the
 * verified email only (the Supabase user ids stay null).
 * The development-only mock admin (`next dev` outside Vercel) is resolved inside requireAdmin; it never applies elsewhere.
 * 
 * @param data - The validated item schema details
 * @returns Success status indicator
 */
export async function upsertItem(data: z.infer<typeof itemSchema>) {
  const { admin, supabase } = await getAdminClient();

  const validatedData = itemSchema.parse(data);
  const { id, ...itemFields } = validatedData;

  const itemData: FoundItemUpdate = {
    ...itemFields,
    updated_at: new Date().toISOString(),
    updated_by: null,
    updated_by_email: admin.email,
  };

  if (id) {
    const { error } = await supabase
      .from("found_items")
      .update(itemData)
      .eq("id", id);
    if (error) throw error;
  } else {
    itemData.created_by = null;
    itemData.created_by_email = admin.email;
    const { error } = await supabase
      .from("found_items")
      .insert([itemData]);
    if (error) throw error;
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/catalog");
  return { success: true };
}

/**
 * Archives found items that are in 'claimed' or 'disposed' status and were found more than 30 days ago.
 * Requires admin privileges.
 * 
 * @returns Success status indicator
 */
export async function archiveOldItems() {
  const { admin, supabase } = await getAdminClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

  const { error } = await supabase
    .from("found_items")
    .update({
      archived_at: new Date().toISOString(),
      updated_by: null,
      updated_by_email: admin.email,
    })
    .in("status", ["claimed", "disposed"])
    .lt("date_found", dateStr)
    .is("archived_at", null);

  if (error) throw error;

  revalidatePath("/admin/dashboard");
  return { success: true };
}

/**
 * Permanently deletes a found item from the database.
 * Also removes any associated photo file from the Supabase storage bucket ('item-images').
 * Requires admin privileges.
 * 
 * @param id - The UUID of the item to delete
 * @param photoPath - Optional key/path of the associated photo in storage
 * @returns Success status indicator
 */
export async function deleteItem(id: string, photoPath?: string | null) {
  const { supabase } = await getAdminClient();

  if (photoPath) {
    await supabase.storage.from("item-images").remove([photoPath]);
  }

  const { error } = await supabase
    .from("found_items")
    .delete()
    .eq("id", id);

  if (error) throw error;

  revalidatePath("/admin/dashboard");
  revalidatePath("/catalog");
  return { success: true };
}

/**
 * Gets a count of items registered per date, used for timeline/calendar views in the admin portal.
 * 
 * @returns Array of date strings and their corresponding item counts
 */
export async function getAdminItemCountsByDate() {
  const { supabase } = await getAdminClient();
  const { data, error } = await supabase.rpc("get_admin_catalog_item_counts_by_date");
  if (error) throw error;
  return data as { date_found: string; item_count: number }[];
}
