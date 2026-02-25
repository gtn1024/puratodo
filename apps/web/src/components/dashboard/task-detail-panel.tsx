'use client'

import type { Task } from '@/actions/tasks'
import type { RecurrenceEditorValue, RecurrenceFrequency, RecurrenceUpdateScope } from '@/components/dashboard/recurrence-fields'
import { format } from 'date-fns'
import { CalendarIcon, Clock, ExternalLink, FileText, Link, Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getTaskById, updateTask } from '@/actions/tasks'
import {

  RecurrenceFields,

} from '@/components/dashboard/recurrence-fields'
import { ReminderFields } from '@/components/dashboard/reminder-fields'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { useI18n } from '@/i18n'

interface TaskDetailPanelProps {
  taskId: string | null
  onTaskUpdated: () => void
  onClose: () => void
}

function normalizeRecurrenceFrequency(
  frequency: string | null,
): RecurrenceFrequency {
  if (
    frequency === 'daily'
    || frequency === 'weekly'
    || frequency === 'monthly'
    || frequency === 'custom'
  ) {
    return frequency
  }
  return ''
}

function createRecurrenceEditorValue(task: Task): RecurrenceEditorValue {
  const frequency = normalizeRecurrenceFrequency(task.recurrence_frequency)
  const fallbackTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

  return {
    frequency,
    interval: task.recurrence_interval?.toString() || (frequency ? '1' : ''),
    weekdays: task.recurrence_weekdays || [],
    endType: task.recurrence_end_date
      ? 'onDate'
      : task.recurrence_end_count
        ? 'afterCount'
        : 'never',
    endDate: task.recurrence_end_date
      ? new Date(task.recurrence_end_date)
      : undefined,
    endCount: task.recurrence_end_count?.toString() || '',
    rule: task.recurrence_rule || '',
    timezone: task.recurrence_timezone || (frequency ? fallbackTimezone : ''),
  }
}

export function TaskDetailPanel({ taskId, onTaskUpdated, onClose }: TaskDetailPanelProps) {
  const { t } = useI18n()
  const [task, setTask] = useState<Task | null>(null)
  const [name, setName] = useState('')
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const [planDate, setPlanDate] = useState<Date | undefined>()
  const [comment, setComment] = useState('')
  const [url, setUrl] = useState('')
  const [durationMinutes, setDurationMinutes] = useState<string>('')
  const [recurrence, setRecurrence] = useState<RecurrenceEditorValue>({
    frequency: '',
    interval: '',
    weekdays: [],
    endType: 'never',
    endDate: undefined,
    endCount: '',
    rule: '',
    timezone: '',
  })
  const [recurrenceScope, setRecurrenceScope]
    = useState<RecurrenceUpdateScope>('single')
  const [remindAt, setRemindAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load task data when taskId changes
  useEffect(() => {
    async function loadTask() {
      if (!taskId) {
        setTask(null)
        return
      }

      setIsLoading(true)
      const result = await getTaskById(taskId)
      if (result) {
        setTask(result)
        setName(result.name)
        setDueDate(result.due_date ? new Date(result.due_date) : undefined)
        setPlanDate(result.plan_date ? new Date(result.plan_date) : undefined)
        setComment(result.comment || '')
        setUrl(result.url || '')
        setDurationMinutes(result.duration_minutes?.toString() || '')
        setRecurrence(createRecurrenceEditorValue(result))
        setRecurrenceScope('single')
        setRemindAt(result.remind_at)
      }
      else {
        setTask(null)
      }
      setIsLoading(false)
    }
    loadTask()
  }, [taskId])

  // Convert Date to local YYYY-MM-DD string (avoiding timezone issues)
  const toLocalDateString = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleSave = async () => {
    if (!task || !name.trim())
      return

    const fallbackTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    const parsedInterval = Number.parseInt(recurrence.interval, 10)
    const parsedEndCount = Number.parseInt(recurrence.endCount, 10)

    const recurrencePayload = recurrence.frequency
      ? {
          recurrence_frequency: recurrence.frequency,
          recurrence_interval:
            Number.isInteger(parsedInterval) && parsedInterval > 0
              ? parsedInterval
              : 1,
          recurrence_weekdays:
            recurrence.frequency === 'weekly' || recurrence.frequency === 'custom'
              ? recurrence.weekdays.length > 0
                ? Array.from(new Set(recurrence.weekdays)).sort((a, b) => a - b)
                : null
              : null,
          recurrence_end_date:
            recurrence.endType === 'onDate' && recurrence.endDate
              ? toLocalDateString(recurrence.endDate)
              : null,
          recurrence_end_count:
            recurrence.endType === 'afterCount'
            && Number.isInteger(parsedEndCount)
            && parsedEndCount > 0
              ? parsedEndCount
              : null,
          recurrence_rule:
            recurrence.frequency === 'custom'
              ? recurrence.rule.trim() || null
              : null,
          recurrence_timezone:
            recurrence.timezone.trim() || fallbackTimezone || null,
        }
      : {
          recurrence_frequency: null,
          recurrence_interval: null,
          recurrence_weekdays: null,
          recurrence_end_date: null,
          recurrence_end_count: null,
          recurrence_rule: null,
          recurrence_timezone: null,
        }

    setIsSaving(true)
    const result = await updateTask(task.id, {
      name: name.trim(),
      due_date: dueDate ? toLocalDateString(dueDate) : null,
      plan_date: planDate ? toLocalDateString(planDate) : null,
      comment: comment.trim() || null,
      url: url.trim() || null,
      duration_minutes: durationMinutes ? Number.parseInt(durationMinutes, 10) : null,
      ...recurrencePayload,
      recurrence_update_scope: recurrenceScope,
      remind_at: remindAt,
    })

    setIsSaving(false)

    if (result.success) {
      onTaskUpdated()
    }
  }

  const clearDueDate = () => setDueDate(undefined)
  const clearPlanDate = () => setPlanDate(undefined)

  // Empty state - no task selected
  if (!taskId) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center border-l border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
        <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-stone-400" />
        </div>
        <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">
          {t('taskPanel.emptyStates.noTaskSelected')}
        </h3>
        <p className="text-sm text-stone-500 dark:text-stone-400 max-w-xs">
          {t('taskPanel.emptyStates.clickToView')}
        </p>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center border-l border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    )
  }

  // Task not found
  if (!task) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center border-l border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
        <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
          <X className="h-8 w-8 text-stone-400" />
        </div>
        <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">
          {t('taskPanel.emptyStates.taskNotFound')}
        </h3>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {t('taskPanel.emptyStates.taskMayBeDeleted')}
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={onClose}>
          {t('common.close')}
        </Button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col border-l border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
          {t('taskDetail.taskDetails')}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Task Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="font-medium text-stone-700 dark:text-stone-300">
              {t('taskDetail.fields.taskName')}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('taskDetail.fields.enterTaskName')}
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 font-medium text-stone-700 dark:text-stone-300">
                <CalendarIcon className="h-4 w-4 text-stone-500 dark:text-stone-400" />
                {t('taskDetail.dueDate')}
              </Label>
              {dueDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearDueDate}
                  className="h-6 px-2 text-stone-500"
                >
                  <X className="h-3 w-3 mr-1" />
                  {t('taskDetail.clear')}
                </Button>
              )}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${
                    !dueDate ? 'text-stone-500' : ''
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'PPP') : t('taskDetail.selectDueDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Plan Date */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 font-medium text-stone-700 dark:text-stone-300">
                <CalendarIcon className="h-4 w-4 text-stone-500 dark:text-stone-400" />
                {t('taskDetail.planDate')}
              </Label>
              {planDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearPlanDate}
                  className="h-6 px-2 text-stone-500"
                >
                  <X className="h-3 w-3 mr-1" />
                  {t('taskDetail.clear')}
                </Button>
              )}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${
                    !planDate ? 'text-stone-500' : ''
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {planDate ? format(planDate, 'PPP') : t('taskDetail.selectPlanDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={planDate}
                  onSelect={setPlanDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="flex items-center gap-2 font-medium text-stone-700 dark:text-stone-300">
              <Clock className="h-4 w-4 text-stone-500 dark:text-stone-400" />
              {t('taskDetail.duration')}
            </Label>
            <Input
              id="duration"
              type="number"
              min="0"
              value={durationMinutes}
              onChange={e => setDurationMinutes(e.target.value)}
              placeholder={t('taskDetail.fields.durationExample')}
            />
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="url" className="flex items-center gap-2 font-medium text-stone-700 dark:text-stone-300">
              <Link className="h-4 w-4 text-stone-500 dark:text-stone-400" />
              {t('taskDetail.url')}
            </Label>
            <div className="flex gap-2">
              <Input
                id="url"
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder={t('taskDetail.fields.urlPlaceholder')}
                className="flex-1"
              />
              {url && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                  title={t('taskDetail.openUrl')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Recurrence */}
          <RecurrenceFields
            value={recurrence}
            onChange={setRecurrence}
            updateScope={recurrenceScope}
            onUpdateScopeChange={setRecurrenceScope}
          />

          {/* Reminder */}
          <ReminderFields
            remindAt={remindAt}
            dueDate={dueDate ? toLocalDateString(dueDate) : null}
            planDate={planDate ? toLocalDateString(planDate) : null}
            onChange={({ remindAt: newRemindAt }) => setRemindAt(newRemindAt)}
          />

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="flex items-center gap-2 font-medium text-stone-700 dark:text-stone-300">
              <FileText className="h-4 w-4 text-stone-500 dark:text-stone-400" />
              {t('taskDetail.comment')}
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder={t('taskDetail.fields.addNotes')}
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-stone-200 dark:border-stone-800">
        <div className="flex gap-3">
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
          >
            {isSaving
              ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('common.loading')}
                  </>
                )
              : (
                  t('common.save')
                )}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            {t('common.close')}
          </Button>
        </div>
      </div>
    </div>
  )
}
