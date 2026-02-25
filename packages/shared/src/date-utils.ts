import { format, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns'

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
