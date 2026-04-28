"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdmin } from "@/utils/admin";

const categorySchema = z.object({
  slug: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  prefix: z.string().min(2).max(4).toUpperCase(),
});

export async function getCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("found_item_categories")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
}

export async function upsertCategory(data: z.infer<typeof categorySchema>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    throw new Error("Unauthorized");
  }

  const validatedData = categorySchema.parse(data);

  const { error } = await supabase
    .from("found_item_categories")
    .upsert({
      ...validatedData,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    if (error.code === "23505") {
      if (error.message.includes("prefix")) {
        throw new Error("Prefix already exists");
      }
      throw new Error("Category slug already exists");
    }
    throw error;
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/dashboard");
  revalidatePath("/catalog");
  return { success: true };
}

export async function deleteCategory(slug: string, reassignToSlug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    throw new Error("Unauthorized");
  }

  if (slug === reassignToSlug) {
    throw new Error("Cannot reassign to the same category");
  }

  // 1. Check if it's the last category
  const { count } = await supabase
    .from("found_item_categories")
    .select("*", { count: "exact", head: true });

  if (count && count <= 1) {
    throw new Error("Cannot delete the last remaining category");
  }

  // 2. Perform reassignment and deletion in a transaction (via RPC or sequential)
  // Supabase doesn't support multi-table transactions in JS client easily without RPC.
  // We'll use sequential calls here for simplicity, but a proper implementation should use RPC.
  
  // Reassign items
  const { error: updateError } = await supabase
    .from("found_items")
    .update({ category: reassignToSlug })
    .eq("category", slug);

  if (updateError) throw updateError;

  // Delete category
  const { error: deleteError } = await supabase
    .from("found_item_categories")
    .delete()
    .eq("slug", slug);

  if (deleteError) throw deleteError;

  revalidatePath("/admin/categories");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/dashboard");
  revalidatePath("/catalog");
  return { success: true };
}
