/**
 * Natural Language Task Parser
 *
 * Parses free-text task input to extract structured fields:
 * - title: Clean task name
 * - due_date: Due date (YYYY-MM-DD)
 * - plan_date: Plan date (YYYY-MM-DD)
 * - duration_minutes: Estimated duration
 * - starred: Priority hints (!, !!, important, urgent)
 * - subtasks: Extracted subtask hints
 */

import { getLocalDateString } from '@puratodo/shared'

export interface ParsedTask {
  title: string
  due_date: string | null
  plan_date: string | null
  duration_minutes: number | null
  starred: boolean
  subtasks: string[]
  confidence: 'high' | 'medium' | 'low'
  detectedHints: string[]
}

// Date-related keywords (English)
const EN_DATE_KEYWORDS: Record<string, () => string> = {
  'today': () => getLocalDateString(new Date()),
  'tomorrow': () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return getLocalDateString(d)
  },
  'yesterday': () => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return getLocalDateString(d)
  },
  'next week': () => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return getLocalDateString(d)
  },
  'next monday': () => getNextWeekday(1),
  'next tuesday': () => getNextWeekday(2),
  'next wednesday': () => getNextWeekday(3),
  'next thursday': () => getNextWeekday(4),
  'next friday': () => getNextWeekday(5),
  'next saturday': () => getNextWeekday(6),
  'next sunday': () => getNextWeekday(0),
  'this week': () => getEndOfWeek(),
  'eow': () => getEndOfWeek(), // end of week
  'eom': () => getEndOfMonth(), // end of month
}

// Date-related keywords (Chinese)
const ZH_DATE_KEYWORDS: Record<string, () => string> = {
  '今天': () => getLocalDateString(new Date()),
  '明天': () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return getLocalDateString(d)
  },
  '后天': () => {
    const d = new Date()
    d.setDate(d.getDate() + 2)
    return getLocalDateString(d)
  },
  '大后天': () => {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    return getLocalDateString(d)
  },
  '昨天': () => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return getLocalDateString(d)
  },
  '下周': () => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return getLocalDateString(d)
  },
  '下周一': () => getNextWeekday(1),
  '下周二': () => getNextWeekday(2),
  '下周三': () => getNextWeekday(3),
  '下周四': () => getNextWeekday(4),
  '下周五': () => getNextWeekday(5),
  '下周六': () => getNextWeekday(6),
  '下周日': () => getNextWeekday(0),
  '这周': () => getEndOfWeek(),
  '本周': () => getEndOfWeek(),
  '月底': () => getEndOfMonth(),
  '月末': () => getEndOfMonth(),
}

// Priority keywords (English)
const EN_PRIORITY_KEYWORDS = [
  'important',
  'urgent',
  'critical',
  'asap',
  'priority',
  'high priority',
  'must do',
  'do first',
]

// Priority keywords (Chinese)
const ZH_PRIORITY_KEYWORDS = [
  '重要',
  '紧急',
  '优先',
  '必须',
  '赶紧',
  '抓紧',
  '立刻',
  '马上',
]

// Duration patterns (English)
const EN_DURATION_PATTERNS: Array<{ pattern: RegExp, minutes: number }> = [
  { pattern: /(\d+)\s*(?:hour|hr|h)\b/i, minutes: 60 },
  { pattern: /(\d+)\s*(?:minute|min|m)\b/i, minutes: 1 },
  { pattern: /(\d+\.?\d*)\s*(?:hour|hr)s?\b/i, minutes: 60 },
  { pattern: /half\s*(?:an?\s*)?hour\b/i, minutes: 30 },
  { pattern: /(?:a|an)\s*hour\b/i, minutes: 60 },
  { pattern: /(?:a|an)\s*half\b/i, minutes: 30 },
  { pattern: /(\d+)h(\d+)m?\b/i, minutes: 1 }, // 1h30m format
  { pattern: /(\d+)h\b/i, minutes: 60 }, // 2h format
]

// Duration patterns (Chinese)
const ZH_DURATION_PATTERNS: Array<{ pattern: RegExp, minutes: number }> = [
  { pattern: /(\d+)\s*小时\b/, minutes: 60 },
  { pattern: /(\d+)\s*分钟\b/, minutes: 1 },
  { pattern: /(\d+)\s*个?小时\b/, minutes: 60 },
  { pattern: /半小时\b/, minutes: 30 },
  { pattern: /一个?小时\b/, minutes: 60 },
  { pattern: /一个?半\b/, minutes: 90 },
  { pattern: /(\d+)个?半\b/, minutes: 90 },
]

// Due date keywords (English)
const EN_DUE_KEYWORDS = ['by', 'due', 'before', 'until', 'deadline']

// Due date keywords (Chinese)
const ZH_DUE_KEYWORDS = ['之前', '之前完成', '截止', '到期', '之前做']

// Plan date keywords (English)
const EN_PLAN_KEYWORDS = ['on', 'at', 'schedule', 'planned', 'do it']

// Plan date keywords (Chinese)
const ZH_PLAN_KEYWORDS = ['安排', '计划', '打算']

// Helper functions
function getNextWeekday(targetDay: number): string {
  const today = new Date()
  const currentDay = today.getDay()
  let daysUntil = targetDay - currentDay
  if (daysUntil <= 0) {
    daysUntil += 7
  }
  today.setDate(today.getDate() + daysUntil)
  return getLocalDateString(today)
}

function getEndOfWeek(): string {
  const today = new Date()
  const currentDay = today.getDay()
  const daysUntilSunday = 7 - currentDay
  today.setDate(today.getDate() + daysUntilSunday)
  return getLocalDateString(today)
}

function getEndOfMonth(): string {
  const today = new Date()
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  return getLocalDateString(lastDay)
}

function parseRelativeDate(text: string, keywords: Record<string, () => string>): { date: string, matchedKeyword: string } | null {
  const lowerText = text.toLowerCase()
  // Sort keywords by length (longest first) to match longer phrases before shorter ones
  // e.g., "大后天" (3 chars) should match before "后天" (2 chars)
  const sortedKeywords = Object.entries(keywords).sort((a, b) => b[0].length - a[0].length)
  for (const [keyword, getDate] of sortedKeywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      return { date: getDate(), matchedKeyword: keyword }
    }
  }
  return null
}

function parseAbsoluteDate(text: string): { date: string, matchedText: string } | null {
  // Match YYYY-MM-DD
  const isoMatch = text.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/)
  if (isoMatch) {
    const [full, year, month, day] = isoMatch
    const date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    return { date, matchedText: full }
  }

  // Match MM/DD or MM-DD (assume current year)
  const shortDateMatch = text.match(/\b(\d{1,2})[/-](\d{1,2})\b/)
  if (shortDateMatch) {
    const [full, month, day] = shortDateMatch
    const year = new Date().getFullYear()
    const date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    return { date, matchedText: full }
  }

  // Match Chinese date format: X月X日
  const zhDateMatch = text.match(/(\d{1,2})月(\d{1,2})[日号]/)
  if (zhDateMatch) {
    const [full, month, day] = zhDateMatch
    const year = new Date().getFullYear()
    const date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    return { date, matchedText: full }
  }

  // Match "Jan 15", "January 15", "15 Jan", "15 January"
  const months: Record<string, number> = {
    'jan': 1, 'january': 1,
    'feb': 2, 'february': 2,
    'mar': 3, 'march': 3,
    'apr': 4, 'april': 4,
    'may': 5,
    'jun': 6, 'june': 6,
    'jul': 7, 'july': 7,
    'aug': 8, 'august': 8,
    'sep': 9, 'sept': 9, 'september': 9,
    'oct': 10, 'october': 10,
    'nov': 11, 'november': 11,
    'dec': 12, 'december': 12,
  }

  // "Jan 15" or "January 15th"
  const monthDayMatch = text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i)
  if (monthDayMatch) {
    const month = months[monthDayMatch[1].toLowerCase()]
    const day = parseInt(monthDayMatch[2], 10)
    const year = new Date().getFullYear()
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return { date, matchedText: monthDayMatch[0] }
  }

  // "15 Jan" or "15th January"
  const dayMonthMatch = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\b/i)
  if (dayMonthMatch) {
    const day = parseInt(dayMonthMatch[1], 10)
    const month = months[dayMonthMatch[2].toLowerCase()]
    const year = new Date().getFullYear()
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return { date, matchedText: dayMonthMatch[0] }
  }

  return null
}

function parseDuration(text: string, patterns: Array<{ pattern: RegExp, minutes: number }>): { minutes: number, matchedText: string } | null {
  for (const { pattern, minutes: multiplier } of patterns) {
    const match = text.match(pattern)
    if (match) {
      if (match[1] && match[2]) {
        // Handle 1h30m format
        const hours = parseInt(match[1], 10)
        const mins = parseInt(match[2], 10)
        return { minutes: hours * 60 + mins, matchedText: match[0] }
      } else if (match[1]) {
        const value = parseFloat(match[1])
        return { minutes: Math.round(value * multiplier), matchedText: match[0] }
      } else {
        return { minutes: multiplier, matchedText: match[0] }
      }
    }
  }
  return null
}

function parsePriority(text: string): { starred: boolean, matchedKeyword: string | null } {
  // Check for exclamation marks
  const exclMatch = text.match(/(!{1,3})$/)
  if (exclMatch) {
    return { starred: true, matchedKeyword: exclMatch[1] }
  }

  // Check English priority keywords
  const lowerText = text.toLowerCase()
  for (const keyword of EN_PRIORITY_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return { starred: true, matchedKeyword: keyword }
    }
  }

  // Check Chinese priority keywords
  for (const keyword of ZH_PRIORITY_KEYWORDS) {
    if (text.includes(keyword)) {
      return { starred: true, matchedKeyword: keyword }
    }
  }

  return { starred: false, matchedKeyword: null }
}

function parseSubtasks(text: string): { subtasks: string[], cleanedText: string } {
  const subtasks: string[] = []
  let cleanedText = text

  // Match patterns like:
  // - "task + subtask1 + subtask2"
  // - "task, subtask1, subtask2"
  // - "task; subtask1; subtask2"
  // - "task and subtask1"

  // Check for "+" separators
  const plusMatch = text.match(/\s*\+\s*(.+)$/)
  if (plusMatch) {
    const items = plusMatch[1].split(/\s*\+\s*/)
    subtasks.push(...items.filter(item => item.trim().length > 0))
    cleanedText = text.replace(/\s*\+\s*.+$/, '')
  }

  // Check for "with X and Y" pattern
  const withMatch = cleanedText.match(/\s+with\s+(.+)$/i)
  if (withMatch) {
    const items = withMatch[1].split(/\s+and\s+/i)
    subtasks.push(...items.filter(item => item.trim().length > 0))
    cleanedText = cleanedText.replace(/\s+with\s+.+$/i, '')
  }

  return { subtasks, cleanedText }
}

function hasDueKeyword(text: string): boolean {
  const lowerText = text.toLowerCase()
  for (const keyword of EN_DUE_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return true
    }
  }
  for (const keyword of ZH_DUE_KEYWORDS) {
    if (text.includes(keyword)) {
      return true
    }
  }
  return false
}

function hasPlanKeyword(text: string): boolean {
  const lowerText = text.toLowerCase()
  for (const keyword of EN_PLAN_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return true
    }
  }
  for (const keyword of ZH_PLAN_KEYWORDS) {
    if (text.includes(keyword)) {
      return true
    }
  }
  return false
}

/**
 * Parse natural language task input
 */
export function parseTaskInput(input: string): ParsedTask {
  let text = input.trim()
  const detectedHints: string[] = []
  let confidence: 'high' | 'medium' | 'low' = 'high'

  // Default values
  let title = text
  let due_date: string | null = null
  let plan_date: string | null = null
  let duration_minutes: number | null = null
  let starred = false

  // Parse subtasks first (they affect the main text)
  const { subtasks, cleanedText: textAfterSubtasks } = parseSubtasks(text)
  text = textAfterSubtasks
  if (subtasks.length > 0) {
    detectedHints.push(`subtasks: ${subtasks.length}`)
  }

  // Parse priority
  const priorityResult = parsePriority(text)
  starred = priorityResult.starred
  if (priorityResult.matchedKeyword) {
    detectedHints.push(`priority: ${priorityResult.matchedKeyword}`)
    text = text.replace(priorityResult.matchedKeyword, '').replace(/!+$/, '').trim()
    title = text
  }

  // Parse duration
  const enDuration = parseDuration(text, EN_DURATION_PATTERNS)
  const zhDuration = parseDuration(text, ZH_DURATION_PATTERNS)
  const durationResult = enDuration || zhDuration
  if (durationResult) {
    duration_minutes = durationResult.minutes
    detectedHints.push(`duration: ${durationResult.minutes}min`)
    text = text.replace(durationResult.matchedText, '').trim()
    title = text
  }

  // Determine if date should be due_date or plan_date
  const isDueContext = hasDueKeyword(text)
  const isPlanContext = hasPlanKeyword(text)

  // Parse relative dates (English)
  const enRelativeDate = parseRelativeDate(text, EN_DATE_KEYWORDS)
  // Parse relative dates (Chinese)
  const zhRelativeDate = parseRelativeDate(text, ZH_DATE_KEYWORDS)
  // Parse absolute dates
  const absoluteDate = parseAbsoluteDate(text)

  const dateResult = enRelativeDate || zhRelativeDate || absoluteDate

  if (dateResult) {
    const date = dateResult.date
    const matchedText = 'matchedKeyword' in dateResult ? dateResult.matchedKeyword : dateResult.matchedText

    if (isDueContext) {
      due_date = date
      detectedHints.push(`due: ${date}`)
    } else if (isPlanContext) {
      plan_date = date
      detectedHints.push(`plan: ${date}`)
    } else {
      // Default: ambiguous dates go to plan_date for "do on X" semantics
      // If it's a deadline-like phrase (by, due, before), it goes to due_date
      // Otherwise, plan_date is more natural for scheduling
      plan_date = date
      detectedHints.push(`plan: ${date}`)
    }

    // Remove date from title
    text = text.replace(matchedText, '').trim()
    // Also remove date keywords
    text = text.replace(/\b(by|due|before|until|on|at)\b/gi, '').trim()
    // Remove Chinese date keywords
    text = text.replace(/(之前|截止|到期|安排|计划)/g, '').trim()
    title = text
  }

  // Clean up title
  title = title
    .replace(/\s+/g, ' ')
    .replace(/^[,;:\s]+|[,;:\s]+$/g, '')
    .trim()

  // If title is empty after parsing, use original input
  if (!title) {
    title = input.trim()
    confidence = 'low'
  }

  // Adjust confidence based on what was detected
  if (detectedHints.length === 0) {
    confidence = 'high' // No parsing needed, simple task
  } else if (detectedHints.length > 2) {
    confidence = 'medium' // Multiple hints, might need verification
  }

  return {
    title,
    due_date,
    plan_date,
    duration_minutes,
    starred,
    subtasks: subtasks.map(s => s.trim()).filter(s => s.length > 0),
    confidence,
    detectedHints,
  }
}

/**
 * Format parsed task for display
 */
export function formatParsedTask(parsed: ParsedTask, locale: string = 'en'): string {
  const parts: string[] = []

  parts.push(`"${parsed.title}"`)

  if (parsed.due_date) {
    parts.push(locale === 'zh' ? `截止: ${parsed.due_date}` : `due: ${parsed.due_date}`)
  }

  if (parsed.plan_date) {
    parts.push(locale === 'zh' ? `计划: ${parsed.plan_date}` : `plan: ${parsed.plan_date}`)
  }

  if (parsed.duration_minutes) {
    parts.push(locale === 'zh' ? `${parsed.duration_minutes}分钟` : `${parsed.duration_minutes}min`)
  }

  if (parsed.starred) {
    parts.push('⭐')
  }

  if (parsed.subtasks.length > 0) {
    parts.push(locale === 'zh' ? `+${parsed.subtasks.length}子任务` : `+${parsed.subtasks.length} subtasks`)
  }

  return parts.join(' | ')
}
