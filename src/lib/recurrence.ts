const ALLOWED_RECURRENCE_FREQUENCIES = [
  "daily",
  "weekly",
  "monthly",
  "custom",
] as const;

export type RecurrenceFrequency = (typeof ALLOWED_RECURRENCE_FREQUENCIES)[number];

export type RecurrenceFields = {
  recurrence_frequency: RecurrenceFrequency | null;
  recurrence_interval: number | null;
  recurrence_weekdays: number[] | null;
  recurrence_end_date: string | null;
  recurrence_end_count: number | null;
  recurrence_rule: string | null;
  recurrence_timezone: string | null;
  recurrence_source_task_id: string | null;
};

type ParseOptions = {
  partial?: boolean;
};

type ParseResult = {
  data: Partial<RecurrenceFields>;
  error?: string;
};

function hasOwn(input: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(input, key);
}

function parseFrequency(value: unknown): {
  value: RecurrenceFrequency | null;
  error?: string;
} {
  if (value === undefined || value === null || value === "") {
    return { value: null };
  }

  if (typeof value !== "string") {
    return { value: null, error: "recurrence_frequency must be a string" };
  }

  const normalized = value.trim().toLowerCase();
  if (!ALLOWED_RECURRENCE_FREQUENCIES.includes(normalized as RecurrenceFrequency)) {
    return {
      value: null,
      error:
        "recurrence_frequency must be one of: daily, weekly, monthly, custom",
    };
  }

  return { value: normalized as RecurrenceFrequency };
}

function parsePositiveInteger(value: unknown, fieldName: string): {
  value: number | null;
  error?: string;
} {
  if (value === undefined || value === null || value === "") {
    return { value: null };
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { value: null, error: `${fieldName} must be a positive integer` };
  }

  return { value: parsed };
}

function parseWeekdays(value: unknown): { value: number[] | null; error?: string } {
  if (value === undefined || value === null || value === "") {
    return { value: null };
  }

  if (!Array.isArray(value)) {
    return { value: null, error: "recurrence_weekdays must be an array" };
  }

  const normalized: number[] = [];
  for (const entry of value) {
    const parsed = Number(entry);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 6) {
      return {
        value: null,
        error: "recurrence_weekdays entries must be integers between 0 and 6",
      };
    }
    normalized.push(parsed);
  }

  return { value: normalized };
}

function parseOptionalDateString(value: unknown, fieldName: string): {
  value: string | null;
  error?: string;
} {
  if (value === undefined || value === null || value === "") {
    return { value: null };
  }

  if (typeof value !== "string") {
    return { value: null, error: `${fieldName} must be a date string` };
  }

  return { value };
}

function parseOptionalString(value: unknown, fieldName: string): {
  value: string | null;
  error?: string;
} {
  if (value === undefined || value === null || value === "") {
    return { value: null };
  }

  if (typeof value !== "string") {
    return { value: null, error: `${fieldName} must be a string` };
  }

  return { value: value.trim() || null };
}

export function parseRecurrenceFields(
  input: Record<string, unknown>,
  options: ParseOptions = {}
): ParseResult {
  const partial = options.partial === true;
  const data: Partial<RecurrenceFields> = {};

  const assign = <K extends keyof RecurrenceFields>(
    key: K,
    parser: () => { value: RecurrenceFields[K]; error?: string }
  ): string | undefined => {
    if (partial && !hasOwn(input, key)) {
      return undefined;
    }

    const parsed = parser();
    if (parsed.error) {
      return parsed.error;
    }

    data[key] = parsed.value;
    return undefined;
  };

  const frequencyError = assign("recurrence_frequency", () =>
    parseFrequency(input.recurrence_frequency)
  );
  if (frequencyError) {
    return { data: {}, error: frequencyError };
  }

  const intervalError = assign("recurrence_interval", () =>
    parsePositiveInteger(input.recurrence_interval, "recurrence_interval")
  );
  if (intervalError) {
    return { data: {}, error: intervalError };
  }

  const weekdaysError = assign("recurrence_weekdays", () =>
    parseWeekdays(input.recurrence_weekdays)
  );
  if (weekdaysError) {
    return { data: {}, error: weekdaysError };
  }

  const endDateError = assign("recurrence_end_date", () =>
    parseOptionalDateString(input.recurrence_end_date, "recurrence_end_date")
  );
  if (endDateError) {
    return { data: {}, error: endDateError };
  }

  const endCountError = assign("recurrence_end_count", () =>
    parsePositiveInteger(input.recurrence_end_count, "recurrence_end_count")
  );
  if (endCountError) {
    return { data: {}, error: endCountError };
  }

  const ruleError = assign("recurrence_rule", () =>
    parseOptionalString(input.recurrence_rule, "recurrence_rule")
  );
  if (ruleError) {
    return { data: {}, error: ruleError };
  }

  const timezoneError = assign("recurrence_timezone", () =>
    parseOptionalString(input.recurrence_timezone, "recurrence_timezone")
  );
  if (timezoneError) {
    return { data: {}, error: timezoneError };
  }

  const sourceTaskError = assign("recurrence_source_task_id", () =>
    parseOptionalString(
      input.recurrence_source_task_id,
      "recurrence_source_task_id"
    )
  );
  if (sourceTaskError) {
    return { data: {}, error: sourceTaskError };
  }

  return { data };
}
