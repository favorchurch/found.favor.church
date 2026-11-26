"use server";

import { getAdminClient } from "@/utils/supabase/admin";

const BUCKET = "item-images";
const SAFE_EXTENSION = /^[a-z0-9]{1,5}$/;

/**
 * Issues a one-time signed upload target so the browser can upload a photo
 * without holding any Supabase credentials beyond the signed token.
 */
export async function createPhotoUploadUrl(fileExtension: string) {
  const { supabase } = await getAdminClient();
  const extension = SAFE_EXTENSION.test(fileExtension.toLowerCase()) ? fileExtension.toLowerCase() : "jpg";
  const path = `${crypto.randomUUID()}.${extension}`;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error) throw error;
  return { path: data.path, token: data.token };
}

/** Removes one stored photo. Storage failures are reported, not thrown, so saving an item is not blocked. */
export async function removePhoto(path: string) {
  const { supabase } = await getAdminClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  return { success: !error };
}

async function findOrphanedPhotos(supabase: Awaited<ReturnType<typeof getAdminClient>>["supabase"]) {
  const { data: files, error: storageError } = await supabase.storage
    .from(BUCKET)
    .list("", { limit: 1000 });
  if (storageError) throw storageError;

  const { data: items, error: dbError } = await supabase.from("found_items").select("photo_path");
  if (dbError) throw dbError;

  const linkedPaths = new Set(items.map((item) => item.photo_path).filter(Boolean));
  const orphans = (files ?? [])
    .filter((file) => file.name !== ".emptyFolderPlaceholder")
    .filter((file) => !linkedPaths.has(file.name))
    .map((file) => file.name);

  return { orphans, totalFiles: files?.length ?? 0, linkedFiles: linkedPaths.size };
}

/** Lists stored photos that no item references. */
export async function scanOrphanedPhotos() {
  const { supabase } = await getAdminClient();
  return findOrphanedPhotos(supabase);
}

/** Deletes the requested photos, but only those that are still unreferenced. */
export async function deleteOrphanedPhotos(names: string[]) {
  const { supabase } = await getAdminClient();
  const { orphans } = await findOrphanedPhotos(supabase);
  const requested = new Set(names);
  const toDelete = orphans.filter((name) => requested.has(name));
  if (toDelete.length === 0) return { deleted: 0 };

  const { error } = await supabase.storage.from(BUCKET).remove(toDelete);
  if (error) throw error;
  return { deleted: toDelete.length };
}
