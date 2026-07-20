"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdmin } from "@/utils/admin";

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
  updated_by?: string;
  created_by?: string;
  created_by_email?: string;
  claimed_date?: string | null;
  claimed_by?: string | null;
  disposed_date?: string | null;
  disposed_by?: string | null;
}

/**
 * Creates a new found item entry or updates an existing one.
 * Requires admin privileges (email ending with @favor.church).
 * In development mode, falls back to a mock developer user if no active session exists.
 * 
 * @param data - The validated item schema details
 * @returns Success status indicator
 */
export async function upsertItem(data: z.infer<typeof itemSchema>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isDev = process.env.NODE_ENV === "development";
  const mockDevUser = {
    id: "00000000-0000-0000-0000-000000000000",
    email: "dev@favor.church",
  };
  const effectiveUser = user || (isDev ? mockDevUser : null);

  if (!effectiveUser || !isAdmin(effectiveUser.email)) {
    throw new Error("Unauthorized");
  }

  const validatedData = itemSchema.parse(data);
  const { id, ...itemFields } = validatedData;

  const isMockId = effectiveUser.id === "00000000-0000-0000-0000-000000000000";

  const itemData: FoundItemUpdate = {
    ...itemFields,
    updated_at: new Date().toISOString(),
    updated_by: isMockId ? undefined : effectiveUser.id,
  };
  if (isMockId) {
    delete (itemData as unknown as Record<string, unknown>).updated_by;
  }

  if (id) {
    const { error } = await supabase
      .from("found_items")
      .update(itemData)
      .eq("id", id);
    if (error) throw error;
  } else {
    if (!isMockId) {
      itemData.created_by = effectiveUser.id;
    }
    itemData.created_by_email = effectiveUser.email || "Unknown";
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isDev = process.env.NODE_ENV === "development";
  const mockDevUser = {
    id: "00000000-0000-0000-0000-000000000000",
    email: "dev@favor.church",
  };
  const effectiveUser = user || (isDev ? mockDevUser : null);

  if (!effectiveUser || !isAdmin(effectiveUser.email)) {
    throw new Error("Unauthorized");
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

  const isMockId = effectiveUser.id === "00000000-0000-0000-0000-000000000000";

  const { error } = await supabase
    .from("found_items")
    .update({ 
      archived_at: new Date().toISOString(),
      ...(isMockId ? {} : { updated_by: effectiveUser.id })
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isDev = process.env.NODE_ENV === "development";
  const mockDevUser = {
    id: "00000000-0000-0000-0000-000000000000",
    email: "dev@favor.church",
  };
  const effectiveUser = user || (isDev ? mockDevUser : null);

  if (!effectiveUser || !isAdmin(effectiveUser.email)) {
    throw new Error("Unauthorized");
  }

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
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_admin_catalog_item_counts_by_date");
  if (error) throw error;
  return data as { date_found: string; item_count: number }[];
}
