/**
 * @file catalogFilters.ts
 * @description Types and normalization helpers for catalog searching and filtering.
 */

/**
 * Represents a venue within the church directory (e.g. Shangri-La Plaza, Kids Room).
 */
export interface CatalogVenue {
  slug: string;
  name: string;
  parent_slug: string | null;
  display_order: number | null;
}

/**
 * Filter statuses for items shown in the administration view.
 */
export type AdminStatusFilter = "all" | "unclaimed" | "claimed" | "disposed";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ADMIN_STATUSES: AdminStatusFilter[] = [
  "all",
  "unclaimed",
  "claimed",
  "disposed",
];

/**
 * Validates whether a value is a valid YYYY-MM-DD ISO date string.
 * 
 * @param value - The input string to check
 * @returns True if value is YYYY-MM-DD
 */
export function isIsoDate(value: string | undefined | null): value is string {
  return Boolean(value && ISO_DATE.test(value));
}

/**
 * Normalizes a status filter value, falling back to "all" if invalid.
 * 
 * @param value - The input filter string
 * @returns A validated AdminStatusFilter value
 */
export function normalizeAdminStatus(
  value: string | undefined | null,
): AdminStatusFilter {
  return ADMIN_STATUSES.includes(value as AdminStatusFilter)
    ? (value as AdminStatusFilter)
    : "all";
}

/**
 * Expands a selected venue filter slug to include its child venues.
 * This ensures queries filtering by a parent venue return items from any sub-venues too.
 * 
 * @param venues - Full list of venues from database
 * @param slug - Selected venue filter slug
 * @returns Array of slugs to query or null (for 'all')
 */
export function expandVenueFilter(
  venues: CatalogVenue[],
  slug: string,
): string[] | null {
  if (slug === "all") return null;

  const target = venues.find((venue) => venue.slug === slug);
  if (!target) return [slug];
  if (target.parent_slug) return [slug];

  const children = venues
    .filter((venue) => venue.parent_slug === slug)
    .map((venue) => venue.slug);

  return [slug, ...children];
}
