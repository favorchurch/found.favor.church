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
  status: z.enum(["unclaimed", "claimed", "disposed"]),
  is_public: z.boolean().default(false),
  photo_path: z.string().nullable().optional(),
  claimed_date: z.string().nullable().optional(),
  claimed_by: z.string().nullable().optional(),
  disposed_date: z.string().nullable().optional(),
  disposed_by: z.string().nullable().optional(),
});

export async function upsertItem(data: z.infer<typeof itemSchema>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    throw new Error("Unauthorized");
  }

  const validatedData = itemSchema.parse(data);
  const { id, ...itemFields } = validatedData;

  const itemData: any = {
    ...itemFields,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  };

  if (id) {
    const { error } = await supabase
      .from("found_items")
      .update(itemData)
      .eq("id", id);
    if (error) throw error;
  } else {
    itemData.created_by = user.id;
    const { error } = await supabase
      .from("found_items")
      .insert([itemData]);
    if (error) throw error;
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/catalog");
  return { success: true };
}

export async function archiveOldItems() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    throw new Error("Unauthorized");
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

  const { error } = await supabase
    .from("found_items")
    .update({ 
      archived_at: new Date().toISOString(),
      updated_by: user.id 
    })
    .in("status", ["claimed", "disposed"])
    .lt("date_found", dateStr)
    .is("archived_at", null);

  if (error) throw error;

  revalidatePath("/admin/dashboard");
  return { success: true };
}

export async function deleteItem(id: string, photoPath?: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
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
