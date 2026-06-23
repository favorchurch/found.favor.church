/**
 * @file photo.ts
 * @description Helper functions for working with found item photos.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * Resolves the public Supabase storage CDN URL for a given item image path.
 * 
 * @param path - Relative storage path of the item's photo
 * @returns The absolute URL to the image or null
 */
export function getPhotoUrl(path: string | null): string | null {
  if (!path || !SUPABASE_URL) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/item-images/${path}`;
}
