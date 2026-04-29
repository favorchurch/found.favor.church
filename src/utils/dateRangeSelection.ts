export interface DateRangeDraft {
  draftFrom: string;
  draftTo: string;
}

export interface DateRangeSelection extends DateRangeDraft {
  filterFrom: string;
  filterTo: string;
  completedRange: boolean;
}

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

function startSingleDaySelection(dateKey: string): DateRangeSelection {
  return {
    draftFrom: dateKey,
    draftTo: "",
    filterFrom: dateKey,
    filterTo: dateKey,
    completedRange: false,
  };
}
