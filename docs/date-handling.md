# Date Handling Best Practices

This guide documents the best practices for handling dates in the PuraToDo application to avoid timezone issues and ensure consistent behavior across different timezones.

## Table of Contents

- [Background](#background)
- [Core Principles](#core-principles)
- [Do's and Don'ts](#dos-and-donts)
- [Common Patterns](#common-patterns)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Background

### The Problem

JavaScript's `Date` object and methods like `toISOString()` can cause timezone-related bugs:

```typescript
// ❌ WRONG - This causes timezone issues
const dateStr = new Date().toISOString().split("T")[0];
```

**Why this fails:**
- `toISOString()` converts the date to **UTC time**
- The resulting date string may not match the user's local date
- Example: In UTC+8 (Beijing), `2026-02-24 01:00` becomes `"2026-02-23T17:00:00.000Z"`
- Splitting gives `"2026-02-23"` instead of the correct local date `"2026-02-24"`

### The Solution

Always use `getLocalDateString()` from `@puratodo/shared`:

```typescript
// ✅ CORRECT - Uses local timezone
import { getLocalDateString } from "@puratodo/shared";

const dateStr = getLocalDateString(new Date()); // Returns "2026-02-24" in any timezone
```

---

## Core Principles

1. **Local Timezone First**: All user-facing dates should be in the user's local timezone
2. **Consistent Storage**: Store dates as `YYYY-MM-DD` strings in the database
3. **Use Shared Utilities**: Always use `@puratodo/shared` utilities for date formatting
4. **Library Support**: Use `date-fns` for date manipulations

---

## Do's and Don'ts

### ✅ DO

#### Use `getLocalDateString()` for formatting

```typescript
import { getLocalDateString } from "@puratodo/shared";

// Format current date
const today = getLocalDateString(new Date());

// Format a specific date
const dateStr = getLocalDateString(someDate);

// When saving to database
await updateTask(taskId, {
  due_date: getLocalDateString(selectedDate)
});
```

#### Use `date-fns` for date parsing and manipulation

```typescript
import { parseISO, format, addDays, subDays, isToday, isTomorrow } from 'date-fns';

// Parse a date string
const date = parseISO(dateString);

// Add/subtract days
const tomorrow = addDays(new Date(), 1);
const yesterday = subDays(new Date(), 1);

// Check relative dates
if (isToday(date)) {
  // Handle today
}
```

#### Use `getLocalDateString()` for date inputs

```typescript
import { getLocalDateString } from "@puratodo/shared";

// React component with date input
<input
  type="date"
  value={date ? getLocalDateString(date) : ''}
  onChange={(e) => setDate(e.target.value ? new Date(e.target.value) : null)}
/>
```

#### Create Date objects from YYYY-MM-DD strings

```typescript
// When reading from database
const date = new Date(task.due_date); // Works fine for YYYY-MM-DD format

// Or use parseISO from date-fns
import { parseISO } from 'date-fns';
const date = parseISO(task.due_date);
```

---

### ❌ DON'T

#### Don't use `toISOString().split("T")[0]`

```typescript
// ❌ WRONG - Converts to UTC, loses local date
const dateStr = new Date().toISOString().split("T")[0];

// ✅ CORRECT - Preserves local date
const dateStr = getLocalDateString(new Date());
```

#### Don't mix UTC and local time

```typescript
// ❌ WRONG - Mixing UTC and local time
const utcDate = new Date().toISOString();
const localDate = new Date(utcDate);
const dateStr = localDate.toISOString().split("T")[0]; // Double conversion!

// ✅ CORRECT - Stay in local time
const dateStr = getLocalDateString(new Date());
```

#### Don't create dates from ambiguous strings

```typescript
// ❌ WRONG - Ambiguous format (MM/DD vs DD/MM)
const date = new Date("02/03/2026");

// ✅ CORRECT - Use ISO format
const date = new Date("2026-02-03");

// ✅ BETTER - Parse with date-fns
import { parseISO } from 'date-fns';
const date = parseISO("2026-02-03");
```

#### Don't use `Date.parse()` for user input

```typescript
// ❌ WRONG - Inconsistent parsing
const timestamp = Date.parse(userInput);

// ✅ CORRECT - Use date-fns parse
import { parse } from 'date-fns';
const date = parse(userInput, 'yyyy-MM-dd', new Date());
```

---

## Common Patterns

### Pattern 1: Displaying dates in the UI

```typescript
import { getLocalDateString } from "@puratodo/shared";
import { format, parseISO } from 'date-fns';

// Simple date string
const dateStr = getLocalDateString(new Date());

// Formatted display
const displayDate = format(new Date(), 'MMMM d, yyyy'); // "February 23, 2026"

// From database value
const date = parseISO(task.due_date);
const displayDate = format(date, 'MMM d, yyyy'); // "Feb 23, 2026"
```

### Pattern 2: Saving dates to database

```typescript
import { getLocalDateString } from "@puratodo/shared";

async function saveTask(taskId: string, dueDate: Date | null) {
  await updateTask(taskId, {
    due_date: dueDate ? getLocalDateString(dueDate) : null
  });
}
```

### Pattern 3: Filtering by date range

```typescript
import { getLocalDateString } from "@puratodo/shared";

function getTasksInDateRange(tasks: Task[], startDate: Date, endDate: Date) {
  const start = getLocalDateString(startDate);
  const end = getLocalDateString(endDate);

  return tasks.filter(task =>
    task.due_date >= start && task.due_date <= end
  );
}
```

### Pattern 4: Calendar grid generation

```typescript
import { getLocalDateString } from "@puratodo/shared";

function getTasksForDate(tasks: Task[], date: Date) {
  const dateStr = getLocalDateString(date);
  return tasks.filter(task =>
    task.plan_date === dateStr || task.due_date === dateStr
  );
}
```

### Pattern 5: Smart date labels

```typescript
import { isToday, isTomorrow, isYesterday, format } from 'date-fns';

function getSmartDateLabel(dateStr: string): string {
  const date = parseISO(dateStr);

  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';

  return format(date, 'MMM d, yyyy');
}
```

---

## API Reference

### `getLocalDateString(date?: Date): string`

**Location**: `packages/shared/src/date-utils.ts`

**Description**: Formats a Date object as a YYYY-MM-DD string using the local timezone.

**Parameters**:
- `date` (optional): The date to format. Defaults to current date/time.

**Returns**: A string in `YYYY-MM-DD` format.

**Example**:
```typescript
import { getLocalDateString } from "@puratodo/shared";

getLocalDateString(new Date()); // "2026-02-23"
getLocalDateString(new Date(2026, 11, 25)); // "2026-12-25"
```

### `formatDate(date: Date | string, formatStr?: string): string`

**Location**: `packages/shared/src/date-utils.ts`

**Description**: Formats a date using date-fns format strings.

**Parameters**:
- `date`: Date object or ISO date string
- `formatStr` (optional): date-fns format string. Defaults to `'yyyy-MM-dd'`.

**Returns**: Formatted date string.

**Example**:
```typescript
import { formatDate } from "@puratodo/shared";

formatDate(new Date()); // "2026-02-23"
formatDate(new Date(), 'MMMM d, yyyy'); // "February 23, 2026"
formatDate("2026-02-23", 'MMM d'); // "Feb 23"
```

### `getRelativeDateLabel(date: Date | string): string`

**Location**: `packages/shared/src/date-utils.ts`

**Description**: Returns a human-readable relative date label (Today, Tomorrow, Yesterday, or formatted date).

**Parameters**:
- `date`: Date object or ISO date string

**Returns**: Relative date label.

**Example**:
```typescript
import { getRelativeDateLabel } from "@puratodo/shared";

getRelativeDateLabel(new Date()); // "Today"
getRelativeDateLabel(tomorrow); // "Tomorrow"
getRelativeDateLabel(lastWeek); // "Feb 16, 2026"
```

---

## Testing

### Testing Date Formatting

When testing code that uses `getLocalDateString()`, mock the timezone if needed:

```typescript
import { getLocalDateString } from "@puratodo/shared";

describe('Date formatting', () => {
  it('should format date correctly', () => {
    const date = new Date(2026, 1, 23, 15, 30); // Feb 23, 2026, 3:30 PM
    const result = getLocalDateString(date);
    expect(result).toBe('2026-02-23');
  });

  it('should handle midnight correctly', () => {
    const midnight = new Date(2026, 1, 23, 0, 0);
    const result = getLocalDateString(midnight);
    expect(result).toBe('2026-02-23');
  });
});
```

### Testing Across Timezones

For code that needs to work across timezones, consider testing with different timezone settings:

```typescript
// In test setup
const originalTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

afterEach(() => {
  // Reset timezone if modified
});

// Test in different timezones (requires mocking)
it('should work in UTC+8', () => {
  // Mock timezone to UTC+8
  const result = getLocalDateString(new Date());
  // Verify behavior
});
```

---

## Troubleshooting

### Problem: Tasks showing on wrong date in calendar

**Symptoms**: A task with `due_date: "2026-02-24"` appears in the Feb 23 cell.

**Cause**: Using `toISOString().split("T")[0]` for date comparison.

**Solution**:
```typescript
// ❌ Before
const dateStr = date.toISOString().split("T")[0];

// ✅ After
import { getLocalDateString } from "@puratodo/shared";
const dateStr = getLocalDateString(date);
```

---

### Problem: Date changes when saving to database

**Symptoms**: User selects Feb 24, but Feb 23 gets saved to database.

**Cause**: Using `toISOString()` which converts to UTC.

**Solution**:
```typescript
// ❌ Before
await updateTask(taskId, {
  due_date: selectedDate.toISOString().split("T")[0]
});

// ✅ After
import { getLocalDateString } from "@puratodo/shared";

await updateTask(taskId, {
  due_date: getLocalDateString(selectedDate)
});
```

---

### Problem: Today view shows yesterday's tasks

**Symptoms**: Tasks due today don't appear in Today view, or yesterday's tasks appear.

**Cause**: Incorrect date comparison due to timezone conversion.

**Solution**:
```typescript
// ❌ Before
const today = new Date().toISOString().split("T")[0];

// ✅ After
import { getLocalDateString } from "@puratodo/shared";

const today = getLocalDateString(new Date());
const todayTasks = tasks.filter(task => task.due_date === today);
```

---

### Problem: Bulk date operation saves wrong date

**Symptoms**: Selecting multiple tasks and setting due date to Feb 25 saves Feb 24 instead.

**Cause**: Date picker value conversion issue.

**Solution**:
```typescript
// ❌ Before
<input
  type="date"
  value={date ? date.toISOString().split("T")[0] : ''}
/>

// ✅ After
import { getLocalDateString } from "@puratodo/shared";

<input
  type="date"
  value={date ? getLocalDateString(date) : ''}
/>
```

---

### Problem: Notifications trigger on wrong day

**Symptoms**: Task reminder fires on Feb 23 when task is due Feb 24.

**Cause**: Date comparison in notification scheduler using UTC.

**Solution**:
```typescript
// ❌ Before
const today = new Date().toISOString().split("T")[0];
const dueDateStr = dueDate.toISOString().split("T")[0];

// ✅ After
import { getLocalDateString } from "@puratodo/shared";

const today = getLocalDateString(new Date());
const dueDateStr = getLocalDateString(dueDate);

if (dueDateStr === today) {
  // Send notification
}
```

---

## Related Resources

- [date-fns Documentation](https://date-fns.org/)
- [JavaScript Date Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
- [Timezone Handling Best Practices](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)

---

## Changelog

### 2026-02-23
- Created initial version of date handling guide
- Documented best practices after fixing timezone issues in app
- Added troubleshooting section for common issues
- Added API reference for shared date utilities

---

## Questions?

If you encounter date-related issues not covered in this guide, please:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review recent changes in the codebase
3. Add a test case to prevent regression
4. Update this document with the solution
