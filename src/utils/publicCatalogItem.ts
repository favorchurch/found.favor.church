/**
 * @file publicCatalogItem.ts
 * @description Types and helper functions for presenting items in the public catalog view.
 */

/**
 * Represents the venue information for a public catalog item, including parent venue nesting.
 */
export interface PublicCatalogVenueName {
  name: string;
  parent_slug: string | null;
  parent?: { name: string } | null;
}

/**
 * Represents an item as configured for the public catalog interface.
 */
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

/**
 * Represents a source object for resolving venue/location strings.
 */
export interface PublicCatalogLocationSource {
  venue_name?: PublicCatalogVenueName | null;
  location?: string | null;
}

/**
 * Resolves a friendly, formatted location string for public items.
 * Concatenates the venue name (and parent venue name if available) with the specific sub-location.
 * 
 * @param item - The item or location source to format
 * @returns A formatted location string (e.g. "Shangri-La Plaza / Kid's Room, Near Stage") or null
 */
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
