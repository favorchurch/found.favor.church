import { createClient } from "@/utils/supabase/server";
import type { PublicCatalogItem } from "@/utils/publicCatalogItem";

type PublicCatalogItemRow = Omit<PublicCatalogItem, "venue_name"> & {
  venue_name?: {
    name: string;
    parent_slug: string | null;
  } | null;
};

export async function getPublicCatalogItem(
  id: string,
): Promise<PublicCatalogItem | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("found_items")
    .select(
      "id, name, description, item_code, category, category_name:found_item_categories(name), venue, venue_name:found_item_venues(name, parent_slug), location, date_found",
    )
    .eq("id", id)
    .eq("is_public", true)
    .is("archived_at", null)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error("Error fetching public catalog item:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    }
    return null;
  }

  const item = data as unknown as PublicCatalogItemRow;
  const parentSlug = item.venue_name?.parent_slug;
  let parent: { name: string } | null = null;

  if (parentSlug) {
    const { data: parentVenue, error: parentError } = await supabase
      .from("found_item_venues")
      .select("name")
      .eq("slug", parentSlug)
      .maybeSingle();

    if (parentError) {
      console.error("Error fetching public catalog parent venue:", {
        message: parentError.message,
        details: parentError.details,
        hint: parentError.hint,
        code: parentError.code,
      });
    }

    parent = parentVenue ? { name: parentVenue.name } : null;
  }

  return {
    ...item,
    venue_name: item.venue_name
      ? {
          ...item.venue_name,
          parent,
        }
      : null,
  };
}
