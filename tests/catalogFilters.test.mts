import assert from "node:assert/strict";
import test from "node:test";
import {
  expandVenueFilter,
  isIsoDate,
  normalizeAdminStatus,
  type CatalogVenue,
} from "../src/utils/catalogFilters.ts";

const venues: CatalogVenue[] = [
  { slug: "podium", name: "Podium Hall", parent_slug: null, display_order: 1 },
  { slug: "podium-main", name: "Main Hall", parent_slug: "podium", display_order: 2 },
  { slug: "studio", name: "Favor Studio", parent_slug: null, display_order: 3 },
];

test("isIsoDate only accepts yyyy-mm-dd values", () => {
  assert.equal(isIsoDate("2026-05-18"), true);
  assert.equal(isIsoDate("May 18, 2026"), false);
  assert.equal(isIsoDate("2026-5-18"), false);
  assert.equal(isIsoDate(""), false);
});

test("expandVenueFilter includes a parent venue and its children", () => {
  assert.deepEqual(expandVenueFilter(venues, "podium"), ["podium", "podium-main"]);
});

test("expandVenueFilter returns only the child when a child venue is selected", () => {
  assert.deepEqual(expandVenueFilter(venues, "podium-main"), ["podium-main"]);
});

test("expandVenueFilter returns null for all venues", () => {
  assert.equal(expandVenueFilter(venues, "all"), null);
});

test("normalizeAdminStatus accepts known admin statuses", () => {
  assert.equal(normalizeAdminStatus("all"), "all");
  assert.equal(normalizeAdminStatus("unclaimed"), "unclaimed");
  assert.equal(normalizeAdminStatus("claimed"), "claimed");
  assert.equal(normalizeAdminStatus("disposed"), "disposed");
});

test("normalizeAdminStatus falls back to all for unknown values", () => {
  assert.equal(normalizeAdminStatus("waiting"), "all");
  assert.equal(normalizeAdminStatus(undefined), "all");
});
