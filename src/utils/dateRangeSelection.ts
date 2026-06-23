/**
 * @file dateRangeSelection.ts
 * @description Helper functions for managing date range filters/selection in the catalog views.
 */

/**
 * Represents a draft/in-progress selection state for start and end dates.
 */
export interface DateRangeDraft {
  draftFrom: string;
  draftTo: string;
}

/**
 * Represents a complete date range filter state with resolved search values.
 */
export interface DateRangeSelection extends DateRangeDraft {
  filterFrom: string;
  filterTo: string;
  completedRange: boolean;
}

/**
 * Handles the selection of a date key in a range selector.
 * If no start date exists or the range is already fully selected, it starts a new single-day range.
 * If the selected date is earlier than the start date, it resets and starts a single-day range from the new date.
 * Otherwise, it completes the range up to the selected date.
 * 
 * @param current - Current in-progress draft range
 * @param dateKey - The clicked/selected ISO date string
 * @returns An updated date range selection state
 */
export function selectDateRange(
  current: DateRangeDraft,
  dateKey: string,
): DateRangeSelection {
  if (!current.draftFrom || current.draftTo) {
    return startSingleDaySelection(dateKey);
  }

  if (dateKey < current.draftFrom) {
    return startSingleDaySelection(dateKey);
  }

  return {
    draftFrom: current.draftFrom,
    draftTo: dateKey,
    filterFrom: current.draftFrom,
    filterTo: dateKey,
    completedRange: true,
  };
}

/**
 * Initializes a new single-day selection range.
 * 
 * @param dateKey - The start date string for the range
 * @returns A fresh date range selection state
 */
function startSingleDaySelection(dateKey: string): DateRangeSelection {
  return {
    draftFrom: dateKey,
    draftTo: "",
    filterFrom: dateKey,
    filterTo: dateKey,
    completedRange: false,
  };
}
