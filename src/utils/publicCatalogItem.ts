export interface PublicCatalogVenueName {
  name: string;
  parent_slug: string | null;
  parent?: { name: string } | null;
}

export interface PublicCatalogItem {
  id: string;
  name: string;
  description: string | null;
  item_code: string;
  category: string;
  category_name?: { name: string } | null;
  venue: string | null;
  venue_name?: PublicCatalogVenueName | null;
  location: string | null;
  date_found: string;
}

export interface PublicCatalogLocationSource {
  venue_name?: PublicCatalogVenueName | null;
  location?: string | null;
}

export function getPublicItemLocation(
  item: PublicCatalogLocationSource,
): string | null {
  const parentName = item.venue_name?.parent?.name;
  const venueName = item.venue_name?.name;
  const venuePath =
    parentName && venueName ? `${parentName} / ${venueName}` : venueName || null;
  const fullLocation = [venuePath, item.location].filter(Boolean).join(", ");

  return fullLocation || null;
}
