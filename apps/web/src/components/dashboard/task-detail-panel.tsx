'use client'

import type { RecurrenceEditorValue, RecurrenceUpdateScope, TaskUpdatePayload } from '@puratodo/task-ui'
import type { Task } from '@/actions/tasks'
import { createRecurrenceEditorValue, TaskDetailDrawer } from '@puratodo/task-ui'
import { FileText, Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getTaskById, updateTask } from '@/actions/tasks'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n'

interface TaskDetailPanelProps {
  taskId: string | null
  onTaskUpdated: () => void
  onClose: () => void
}

export function TaskDetailPanel({ taskId, onTaskUpdated, onClose }: TaskDetailPanelProps) {
  const { t } = useI18n()
  const [task, setTask] = useState<Task | null>(null)
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
  const [recurrenceScope, setRecurrenceScope] = useState<RecurrenceUpdateScope>('single')
  const [remindAt, setRemindAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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

  const handleSave = async (updates: TaskUpdatePayload) => {
    if (!task)
      return

    const result = await updateTask(task.id, updates)

    if (result.success) {
      onTaskUpdated()
    }
  }

  const handleOpenUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

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
        <TaskDetailDrawer
          task={task}
          isLoading={false}
          onSave={handleSave}
          onCancel={onClose}
          onOpenUrl={handleOpenUrl}
          recurrence={recurrence}
          onRecurrenceChange={setRecurrence}
          recurrenceScope={recurrenceScope}
          onRecurrenceScopeChange={setRecurrenceScope}
          remindAt={remindAt}
          onRemindAtChange={setRemindAt}
          labels={{
            // TaskDetailForm labels
            taskName: t('taskDetail.fields.taskName'),
            taskNamePlaceholder: t('taskDetail.fields.enterTaskName'),
            dueDate: t('taskDetail.dueDate'),
            planDate: t('taskDetail.planDate'),
            duration: t('taskDetail.duration'),
            durationPlaceholder: t('taskDetail.fields.durationExample'),
            url: t('taskDetail.url'),
            urlPlaceholder: t('taskDetail.fields.urlPlaceholder'),
            openUrl: t('taskDetail.openUrl'),
            comment: t('taskDetail.comment'),
            commentPlaceholder: t('taskDetail.fields.addNotes'),
            selectDueDate: t('taskDetail.selectDueDate'),
            selectPlanDate: t('taskDetail.selectPlanDate'),
            clear: t('taskDetail.clear'),
            save: t('common.save'),
            cancel: t('common.cancel'),
            loading: t('common.loading'),
            taskNotFound: t('taskPanel.emptyStates.taskNotFound'),

            // RecurrenceEditor labels
            recurrence: t('taskDetail.recurrence'),
            recurrenceNone: t('taskDetail.recurrenceNone'),
            recurrenceDaily: t('taskDetail.recurrenceDaily'),
            recurrenceWeekly: t('taskDetail.recurrenceWeekly'),
            recurrenceMonthly: t('taskDetail.recurrenceMonthly'),
            recurrenceCustom: t('taskDetail.recurrenceCustom'),
            every: t('taskDetail.every'),
            intervalUnitDays: t('taskDetail.intervalUnitDays'),
            intervalUnitWeeks: t('taskDetail.intervalUnitWeeks'),
            intervalUnitMonths: t('taskDetail.intervalUnitMonths'),
            weekdays: t('taskDetail.weekdays'),
            weekdaySun: t('taskDetail.weekdaySun'),
            weekdayMon: t('taskDetail.weekdayMon'),
            weekdayTue: t('taskDetail.weekdayTue'),
            weekdayWed: t('taskDetail.weekdayWed'),
            weekdayThu: t('taskDetail.weekdayThu'),
            weekdayFri: t('taskDetail.weekdayFri'),
            weekdaySat: t('taskDetail.weekdaySat'),
            customRule: t('taskDetail.customRule'),
            customRulePlaceholder: t('taskDetail.customRulePlaceholder'),
            timezone: t('taskDetail.timezone'),
            timezonePlaceholder: t('taskDetail.timezonePlaceholder'),
            end: t('taskDetail.end'),
            endNever: t('taskDetail.endNever'),
            endOnDate: t('taskDetail.endOnDate'),
            endAfterCount: t('taskDetail.endAfterCount'),
            selectEndDate: t('taskDetail.selectEndDate'),
            applyScope: t('taskDetail.applyScope'),
            scopeSingle: t('taskDetail.scopeSingle'),
            scopeFuture: t('taskDetail.scopeFuture'),

            // ReminderEditor labels
            reminderTitle: t('reminder.title'),
            reminderClear: t('taskDetail.clear'),
            reminderNotSupported: t('reminder.notSupported'),
            reminderDenied: t('reminder.denied'),
            reminderEnable: t('reminder.enable'),
            reminderSelectPreset: t('reminder.selectPreset'),
            reminderPresetsNone: t('reminder.presets.none'),
            reminderPresetsAtTime: t('reminder.presets.atTime'),
            reminderPresets5min: t('reminder.presets.5min'),
            reminderPresets15min: t('reminder.presets.15min'),
            reminderPresets30min: t('reminder.presets.30min'),
            reminderPresets1hour: t('reminder.presets.1hour'),
            reminderPresets1day: t('reminder.presets.1day'),
            reminderPresetsCustom: t('reminder.presets.custom'),
            reminderWillRemindAt: t('reminder.willRemindAt'),
            reminderNoDateWarning: t('reminder.noDateWarning'),
          }}
        />
      </div>
    </div>
  )
}
