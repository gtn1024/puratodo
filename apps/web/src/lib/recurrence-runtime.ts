import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables, UpdateTables } from '@/lib/supabase/database.types'

type TaskRow = Tables<'tasks'>
type TaskUpdate = UpdateTables<'tasks'>

const RECURRENCE_FIELD_KEYS = [
  'recurrence_frequency',
  'recurrence_interval',
  'recurrence_weekdays',
  'recurrence_end_date',
  'recurrence_end_count',
  'recurrence_rule',
  'recurrence_timezone',
] as const

const BYDAY_TO_WEEKDAY: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
}

const MAX_OCCURRENCE_SCAN_DAYS = 3650
const DAY_IN_MS = 24 * 60 * 60 * 1000

export type RecurrenceUpdateScope = 'single' | 'future'

export type TaskUpdateWithRecurrenceScope = TaskUpdate & {
  recurrence_update_scope?: RecurrenceUpdateScope
}

export function isValidRecurrenceUpdateScope(
  value: unknown,
): value is RecurrenceUpdateScope {
  return value === 'single' || value === 'future'
}

type EffectiveFrequency = 'daily' | 'weekly' | 'monthly'

interface RecurrenceConfig {
  frequency: EffectiveFrequency
  interval: number
  weekdays: number[]
  endDate: string | null
  endCount: number | null
  timezone: string
}

interface ParsedCustomRule {
  frequency?: EffectiveFrequency
  interval?: number
  weekdays?: number[]
  endDate?: string
  endCount?: number
}

function isValidDateString(value: string | null | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const parsed = parseDateString(value)
  return parsed !== null
}

function parseDateString(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const [yearText, monthText, dayText] = value.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null
  }

  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    return null
  }

  return date
}

function formatDateString(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_IN_MS)
}

function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
}

function addMonthsClamped(date: Date, months: number): Date {
  const currentDay = date.getUTCDate()
  const currentMonth = date.getUTCMonth()
  const currentYear = date.getUTCFullYear()

  const targetMonthIndex = currentMonth + months
  const targetYear = currentYear + Math.floor(targetMonthIndex / 12)
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12
  const daysInTargetMonth = getDaysInMonth(targetYear, normalizedMonth)
  const targetDay = Math.min(currentDay, daysInTargetMonth)

  return new Date(Date.UTC(targetYear, normalizedMonth, targetDay))
}

function startOfWeek(date: Date): Date {
  return addDays(date, -date.getUTCDay())
}

function diffWeeks(start: Date, end: Date): number {
  const diffInDays = Math.floor((end.getTime() - start.getTime()) / DAY_IN_MS)
  return Math.floor(diffInDays / 7)
}

function getTodayInTimezone(timezone: string): string {
  const fallback = new Date()
  const fallbackValue = formatDateString(
    new Date(Date.UTC(
      fallback.getUTCFullYear(),
      fallback.getUTCMonth(),
      fallback.getUTCDate(),
    )),
  )

  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    const parts = formatter.formatToParts(new Date())
    const year = parts.find(part => part.type === 'year')?.value
    const month = parts.find(part => part.type === 'month')?.value
    const day = parts.find(part => part.type === 'day')?.value

    if (!year || !month || !day) {
      return fallbackValue
    }

    const formatted = `${year}-${month}-${day}`
    return isValidDateString(formatted) ? formatted : fallbackValue
  }
  catch {
    return fallbackValue
  }
}

function parseUntilDate(value: string): string | undefined {
  if (!value) {
    return undefined
  }

  const normalized = value.trim()
  if (/^\d{8}$/.test(normalized)) {
    const year = normalized.slice(0, 4)
    const month = normalized.slice(4, 6)
    const day = normalized.slice(6, 8)
    const dateValue = `${year}-${month}-${day}`
    return isValidDateString(dateValue) ? dateValue : undefined
  }

  if (isValidDateString(normalized)) {
    return normalized
  }

  return undefined
}

function parseCustomRule(rule: string | null): ParsedCustomRule {
  if (!rule || !rule.trim()) {
    return {}
  }

  const segments = rule
    .split(';')
    .map(segment => segment.trim())
    .filter(Boolean)

  const parsed: ParsedCustomRule = {}

  for (const segment of segments) {
    const [rawKey, ...rawRest] = segment.split('=')
    if (!rawKey || rawRest.length === 0) {
      continue
    }

    const key = rawKey.trim().toUpperCase()
    const value = rawRest.join('=').trim()

    if (key === 'FREQ') {
      const frequency = value.toUpperCase()
      if (frequency === 'DAILY') {
        parsed.frequency = 'daily'
      }
      else if (frequency === 'WEEKLY') {
        parsed.frequency = 'weekly'
      }
      else if (frequency === 'MONTHLY') {
        parsed.frequency = 'monthly'
      }
    }
    else if (key === 'INTERVAL') {
      const interval = Number(value)
      if (Number.isInteger(interval) && interval > 0) {
        parsed.interval = interval
      }
    }
    else if (key === 'BYDAY') {
      const weekdays = value
        .split(',')
        .map(token => token.trim().toUpperCase())
        .map(token => BYDAY_TO_WEEKDAY[token])
        .filter((day): day is number => Number.isInteger(day) && day >= 0 && day <= 6)

      if (weekdays.length > 0) {
        parsed.weekdays = Array.from(new Set(weekdays)).sort((a, b) => a - b)
      }
    }
    else if (key === 'UNTIL') {
      parsed.endDate = parseUntilDate(value)
    }
    else if (key === 'COUNT') {
      const count = Number(value)
      if (Number.isInteger(count) && count > 0) {
        parsed.endCount = count
      }
    }
  }

  return parsed
}

function normalizeWeekdays(weekdays: number[] | null, fallbackDay: number): number[] {
  const normalized = (weekdays || [])
    .filter(day => Number.isInteger(day) && day >= 0 && day <= 6)
    .map(day => Number(day))

  if (normalized.length === 0) {
    return [fallbackDay]
  }

  return Array.from(new Set(normalized)).sort((a, b) => a - b)
}

function resolveRecurrenceConfig(task: TaskRow): RecurrenceConfig | null {
  const rawFrequency = task.recurrence_frequency
  if (!rawFrequency) {
    return null
  }

  const rule = parseCustomRule(task.recurrence_rule)

  let frequency: EffectiveFrequency | null = null
  if (rawFrequency === 'daily' || rawFrequency === 'weekly' || rawFrequency === 'monthly') {
    frequency = rawFrequency
  }
  else if (rawFrequency === 'custom') {
    frequency = rule.frequency || 'daily'
  }

  if (!frequency) {
    return null
  }

  const intervalCandidate = rule.interval ?? task.recurrence_interval ?? 1
  const interval = Number.isInteger(intervalCandidate) && intervalCandidate > 0
    ? intervalCandidate
    : 1

  let fallbackDay = 1
  const anchorDate = parseDateString(
    task.plan_date || task.due_date || task.created_at.slice(0, 10),
  )
  if (anchorDate) {
    fallbackDay = anchorDate.getUTCDay()
  }

  const weekdays = frequency === 'weekly'
    ? normalizeWeekdays(rule.weekdays ?? task.recurrence_weekdays, fallbackDay)
    : rule.weekdays ?? task.recurrence_weekdays ?? []

  const endDate = rule.endDate ?? task.recurrence_end_date ?? null
  const endCount = rule.endCount ?? task.recurrence_end_count ?? null
  const timezone = task.recurrence_timezone || 'UTC'

  return {
    frequency,
    interval,
    weekdays,
    endDate: isValidDateString(endDate) ? endDate : null,
    endCount: Number.isInteger(endCount) && (endCount || 0) > 0 ? endCount : null,
    timezone,
  }
}

function computeNextWeeklyDate(
  baseDate: string,
  interval: number,
  weekdays: number[],
): string | null {
  const base = parseDateString(baseDate)
  if (!base) {
    return null
  }

  const targetWeekdays = normalizeWeekdays(weekdays, base.getUTCDay())
  const weekStart = startOfWeek(base)

  for (let offset = 1; offset <= MAX_OCCURRENCE_SCAN_DAYS; offset += 1) {
    const candidate = addDays(base, offset)
    const weekday = candidate.getUTCDay()
    if (!targetWeekdays.includes(weekday)) {
      continue
    }

    const candidateWeekStart = startOfWeek(candidate)
    const weeksSinceStart = diffWeeks(weekStart, candidateWeekStart)
    if (weeksSinceStart % interval === 0) {
      return formatDateString(candidate)
    }
  }

  return null
}

function computeNextDate(baseDate: string, config: RecurrenceConfig): string | null {
  const base = parseDateString(baseDate)
  if (!base) {
    return null
  }

  if (config.frequency === 'daily') {
    return formatDateString(addDays(base, config.interval))
  }

  if (config.frequency === 'weekly') {
    return computeNextWeeklyDate(baseDate, config.interval, config.weekdays)
  }

  if (config.frequency === 'monthly') {
    return formatDateString(addMonthsClamped(base, config.interval))
  }

  return null
}

function resolveOccurrenceDate(task: Pick<TaskRow, 'plan_date' | 'due_date' | 'created_at'>): string | null {
  if (isValidDateString(task.plan_date)) {
    return task.plan_date
  }

  if (isValidDateString(task.due_date)) {
    return task.due_date
  }

  const createdDate = task.created_at.slice(0, 10)
  return isValidDateString(createdDate) ? createdDate : null
}

function getSeriesRootId(task: TaskRow): string {
  return task.recurrence_source_task_id || task.id
}

function toOrFilterBySeries(seriesRootId: string): string {
  return `id.eq.${seriesRootId},recurrence_source_task_id.eq.${seriesRootId}`
}

async function fetchSeriesTasks(
  supabase: SupabaseClient,
  userId: string,
  seriesRootId: string,
  listId?: string,
): Promise<{ data: TaskRow[], error?: string }> {
  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .or(toOrFilterBySeries(seriesRootId))

  if (listId) {
    query = query.eq('list_id', listId)
  }

  const { data, error } = await query
  if (error) {
    return { data: [], error: error.message }
  }

  return { data: data || [] }
}

function splitUpdatePayload(
  patch: TaskUpdateWithRecurrenceScope,
): {
  regularPatch: TaskUpdate
  recurrencePatch: TaskUpdate
  hasPatch: boolean
  recurrenceScope: RecurrenceUpdateScope
} {
  const recurrenceScope = patch.recurrence_update_scope || 'single'
  const regularPatch: TaskUpdate = {}
  const recurrencePatch: TaskUpdate = {}

  for (const [key, value] of Object.entries(patch)) {
    if (key === 'recurrence_update_scope') {
      continue
    }

    if (value === undefined) {
      continue
    }

    if ((RECURRENCE_FIELD_KEYS as readonly string[]).includes(key)) {
      (recurrencePatch as Record<string, unknown>)[key] = value;
      (regularPatch as Record<string, unknown>)[key] = value
    }
    else {
      (regularPatch as Record<string, unknown>)[key] = value
    }
  }

  return {
    regularPatch,
    recurrencePatch,
    hasPatch: Object.keys(regularPatch).length > 0,
    recurrenceScope,
  }
}

async function getCurrentTask(
  supabase: SupabaseClient,
  userId: string,
  taskId: string,
  listId?: string,
): Promise<{ data: TaskRow | null, error?: string, status?: number }> {
  let query = supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .eq('user_id', userId)

  if (listId) {
    query = query.eq('list_id', listId)
  }

  const { data, error } = await query.single()
  if (error || !data) {
    return { data: null, error: 'Task not found', status: 404 }
  }

  return { data }
}

async function applyRecurrencePatchToFuture(
  supabase: SupabaseClient,
  userId: string,
  task: TaskRow,
  recurrencePatch: TaskUpdate,
  listId?: string,
): Promise<{ error?: string }> {
  if (Object.keys(recurrencePatch).length === 0) {
    return {}
  }

  const seriesRootId = getSeriesRootId(task)
  const { data: seriesTasks, error: seriesError } = await fetchSeriesTasks(
    supabase,
    userId,
    seriesRootId,
    listId,
  )

  if (seriesError) {
    return { error: seriesError }
  }

  const currentOccurrence = resolveOccurrenceDate(task)
  const targetIds = seriesTasks
    .filter(candidate => candidate.id !== task.id)
    .filter((candidate) => {
      if (!currentOccurrence) {
        return true
      }
      const candidateDate = resolveOccurrenceDate(candidate)
      return candidateDate ? candidateDate >= currentOccurrence : true
    })
    .map(candidate => candidate.id)

  if (targetIds.length === 0) {
    return {}
  }

  let updateQuery = supabase
    .from('tasks')
    .update(recurrencePatch)
    .in('id', targetIds)
    .eq('user_id', userId)

  if (listId) {
    updateQuery = updateQuery.eq('list_id', listId)
  }

  const { error: updateError } = await updateQuery
  if (updateError) {
    return { error: updateError.message }
  }

  return {}
}

async function getNextSortOrder(
  supabase: SupabaseClient,
  userId: string,
  listId: string,
  parentId: string | null,
): Promise<{ sortOrder: number, error?: string }> {
  let query = supabase
    .from('tasks')
    .select('sort_order')
    .eq('user_id', userId)
    .eq('list_id', listId)
    .order('sort_order', { ascending: false })
    .limit(1)

  if (parentId) {
    query = query.eq('parent_id', parentId)
  }
  else {
    query = query.is('parent_id', null)
  }

  const { data, error } = await query
  if (error) {
    return { sortOrder: 0, error: error.message }
  }

  return { sortOrder: (data?.[0]?.sort_order ?? -1) + 1 }
}

async function ensureSeriesSourceLink(
  supabase: SupabaseClient,
  userId: string,
  task: TaskRow,
  listId?: string,
): Promise<{ task: TaskRow, error?: string }> {
  if (task.recurrence_source_task_id) {
    return { task }
  }

  let query = supabase
    .from('tasks')
    .update({ recurrence_source_task_id: task.id })
    .eq('id', task.id)
    .eq('user_id', userId)

  if (listId) {
    query = query.eq('list_id', listId)
  }

  const singleQuery = query.select('*').single()

  const { data, error } = await singleQuery
  if (error || !data) {
    return { task, error: error?.message || 'Failed to link recurrence source task' }
  }

  return { task: data }
}

async function maybeGenerateNextOccurrence(
  supabase: SupabaseClient,
  userId: string,
  task: TaskRow,
  listId?: string,
): Promise<{ task: TaskRow, error?: string }> {
  const config = resolveRecurrenceConfig(task)
  if (!config) {
    return { task }
  }

  const linked = await ensureSeriesSourceLink(supabase, userId, task, listId)
  if (linked.error) {
    return { task, error: linked.error }
  }

  const currentTask = linked.task
  const seriesRootId = getSeriesRootId(currentTask)
  const { data: seriesTasks, error: seriesError } = await fetchSeriesTasks(
    supabase,
    userId,
    seriesRootId,
    listId,
  )

  if (seriesError) {
    return { task: currentTask, error: seriesError }
  }

  if (config.endCount && seriesTasks.length >= config.endCount) {
    return { task: currentTask }
  }

  const currentOccurrenceDate
    = resolveOccurrenceDate(currentTask) || getTodayInTimezone(config.timezone)

  const hasFutureOccurrence = seriesTasks.some((candidate) => {
    if (candidate.id === currentTask.id) {
      return false
    }
    const candidateDate = resolveOccurrenceDate(candidate)
    return candidateDate ? candidateDate > currentOccurrenceDate : false
  })

  if (hasFutureOccurrence) {
    return { task: currentTask }
  }

  let nextPlanDate = currentTask.plan_date
    ? computeNextDate(currentTask.plan_date, config)
    : null
  const nextDueDate = currentTask.due_date
    ? computeNextDate(currentTask.due_date, config)
    : null

  if (!nextPlanDate && !nextDueDate) {
    const today = getTodayInTimezone(config.timezone)
    nextPlanDate = computeNextDate(today, config)
  }

  const nextAnchorDate = nextPlanDate || nextDueDate
  if (!nextAnchorDate) {
    return { task: currentTask }
  }

  if (config.endDate && nextAnchorDate > config.endDate) {
    return { task: currentTask }
  }

  if (config.endCount && seriesTasks.length + 1 > config.endCount) {
    return { task: currentTask }
  }

  const hasDuplicateOccurrence = seriesTasks.some((candidate) => {
    const candidateDate = resolveOccurrenceDate(candidate)
    return candidateDate === nextAnchorDate
  })

  if (hasDuplicateOccurrence) {
    return { task: currentTask }
  }

  const { sortOrder, error: sortError } = await getNextSortOrder(
    supabase,
    userId,
    currentTask.list_id,
    currentTask.parent_id,
  )

  if (sortError) {
    return { task: currentTask, error: sortError }
  }

  const insertPayload: Database['public']['Tables']['tasks']['Insert'] = {
    user_id: userId,
    list_id: currentTask.list_id,
    parent_id: currentTask.parent_id,
    name: currentTask.name,
    completed: false,
    starred: currentTask.starred,
    due_date: nextDueDate,
    plan_date: nextPlanDate,
    comment: currentTask.comment,
    duration_minutes: currentTask.duration_minutes,
    recurrence_frequency: currentTask.recurrence_frequency,
    recurrence_interval: currentTask.recurrence_interval,
    recurrence_weekdays: currentTask.recurrence_weekdays,
    recurrence_end_date: currentTask.recurrence_end_date,
    recurrence_end_count: currentTask.recurrence_end_count,
    recurrence_rule: currentTask.recurrence_rule,
    recurrence_timezone: currentTask.recurrence_timezone,
    recurrence_source_task_id: seriesRootId,
    sort_order: sortOrder,
  }

  const { error: insertError } = await supabase.from('tasks').insert(insertPayload)
  if (insertError) {
    return { task: currentTask, error: insertError.message }
  }

  return { task: currentTask }
}

export async function updateTaskWithRecurrenceHandling(params: {
  supabase: SupabaseClient
  userId: string
  taskId: string
  patch: TaskUpdateWithRecurrenceScope
  listId?: string
}): Promise<{ task?: TaskRow, error?: string, status?: number }> {
  const { supabase, userId, taskId, patch, listId } = params
  const { recurrenceScope, regularPatch, recurrencePatch, hasPatch }
    = splitUpdatePayload(patch)

  if (!hasPatch) {
    return { error: 'At least one field must be provided', status: 400 }
  }

  const currentTaskResult = await getCurrentTask(supabase, userId, taskId, listId)
  if (!currentTaskResult.data) {
    return {
      error: currentTaskResult.error || 'Task not found',
      status: currentTaskResult.status || 404,
    }
  }
  const previousTask = currentTaskResult.data

  let updateQuery = supabase
    .from('tasks')
    .update(regularPatch)
    .eq('id', taskId)
    .eq('user_id', userId)

  if (listId) {
    updateQuery = updateQuery.eq('list_id', listId)
  }

  const { data: updatedTask, error: updateError } = await updateQuery
    .select('*')
    .single()
  if (updateError || !updatedTask) {
    return { error: updateError?.message || 'Failed to update task', status: 500 }
  }

  if (
    recurrenceScope === 'future'
    && Object.keys(recurrencePatch).length > 0
  ) {
    const futureUpdateResult = await applyRecurrencePatchToFuture(
      supabase,
      userId,
      updatedTask,
      recurrencePatch,
      listId,
    )
    if (futureUpdateResult.error) {
      return { error: futureUpdateResult.error, status: 500 }
    }
  }

  let taskAfterGeneration = updatedTask
  if (!previousTask.completed && updatedTask.completed) {
    const generationResult = await maybeGenerateNextOccurrence(
      supabase,
      userId,
      updatedTask,
      listId,
    )
    if (generationResult.error) {
      return { error: generationResult.error, status: 500 }
    }
    taskAfterGeneration = generationResult.task
  }

  return { task: taskAfterGeneration }
}
