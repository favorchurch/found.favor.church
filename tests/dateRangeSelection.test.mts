import assert from "node:assert/strict";
import test from "node:test";
import { selectDateRange } from "../src/utils/dateRangeSelection.ts";

test("first click starts a single-day filter without completing a range", () => {
  const next = selectDateRange({ draftFrom: "", draftTo: "" }, "2026-05-03");

  assert.deepEqual(next, {
    draftFrom: "2026-05-03",
    draftTo: "",
    filterFrom: "2026-05-03",
    filterTo: "2026-05-03",
    completedRange: false,
  });
});

test("second click completes an ordered range", () => {
  const next = selectDateRange(
    { draftFrom: "2026-05-03", draftTo: "" },
    "2026-05-10",
  );

  assert.deepEqual(next, {
    draftFrom: "2026-05-03",
    draftTo: "2026-05-10",
    filterFrom: "2026-05-03",
    filterTo: "2026-05-10",
    completedRange: true,
  });
});

test("clicking an earlier second date restarts the single-day filter", () => {
  const next = selectDateRange(
    { draftFrom: "2026-05-10", draftTo: "" },
    "2026-05-03",
  );

  assert.deepEqual(next, {
    draftFrom: "2026-05-03",
    draftTo: "",
    filterFrom: "2026-05-03",
    filterTo: "2026-05-03",
    completedRange: false,
  });
});

test("clicking after a completed range starts a new single-day filter", () => {
  const next = selectDateRange(
    { draftFrom: "2026-05-03", draftTo: "2026-05-10" },
    "2026-05-17",
  );

  assert.deepEqual(next, {
    draftFrom: "2026-05-17",
    draftTo: "",
    filterFrom: "2026-05-17",
    filterTo: "2026-05-17",
    completedRange: false,
  });
});
