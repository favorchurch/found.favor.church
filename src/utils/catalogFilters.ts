export interface CatalogVenue {
  slug: string;
  name: string;
  parent_slug: string | null;
  display_order: number | null;
}

export type AdminStatusFilter = "all" | "unclaimed" | "claimed" | "disposed";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ADMIN_STATUSES: AdminStatusFilter[] = [
  "all",
  "unclaimed",
  "claimed",
  "disposed",
];

export function isIsoDate(value: string | undefined | null): value is string {
  return Boolean(value && ISO_DATE.test(value));
}

export function normalizeAdminStatus(
  value: string | undefined | null,
): AdminStatusFilter {
  return ADMIN_STATUSES.includes(value as AdminStatusFilter)
    ? (value as AdminStatusFilter)
    : "all";
}

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
