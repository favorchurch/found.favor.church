const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export function getPhotoUrl(path: string | null): string | null {
  if (!path || !SUPABASE_URL) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/item-images/${path}`;
}
