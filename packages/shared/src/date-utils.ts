import { format, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns'

const LOCAL_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/

export function formatDate(date: Date | string, formatStr: string = 'yyyy-MM-dd'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, formatStr)
}

export function getRelativeDateLabel(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date

  if (isToday(d))
    return 'Today'
  if (isTomorrow(d))
    return 'Tomorrow'
  if (isYesterday(d))
    return 'Yesterday'

  return format(d, 'MMM d, yyyy')
}

export function getLocalDateString(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd')
}

/**
 * Parse a YYYY-MM-DD date string as a local date to avoid UTC timezone shifts.
 * Falls back to parseISO for full ISO datetime strings.
 */
export function parseLocalDateString(value: string | null | undefined): Date | undefined {
  if (!value) {
    return undefined
  }

  const match = LOCAL_DATE_REGEX.exec(value)
  if (match) {
    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])
    const date = new Date(year, month - 1, day)

    // Guard against invalid dates like 2026-02-31.
    if (
      date.getFullYear() === year
      && date.getMonth() === month - 1
      && date.getDate() === day
    ) {
      return date
    }
    return undefined
  }

  const parsed = parseISO(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}
