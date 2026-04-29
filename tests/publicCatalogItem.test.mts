import assert from "node:assert/strict";
import test from "node:test";
import { getPublicItemLocation } from "../src/utils/publicCatalogItem.ts";

test("combines parent venue, venue, and detail location", () => {
  const location = getPublicItemLocation({
    venue_name: {
      name: "Podium Hall",
      parent_slug: "the-podium",
      parent: { name: "The Podium" },
    },
    location: "Near registration",
  });

  assert.equal(location, "The Podium / Podium Hall, Near registration");
});

test("returns null when venue and location are missing", () => {
  const location = getPublicItemLocation({
    venue_name: null,
    location: null,
  });

  assert.equal(location, null);
});
