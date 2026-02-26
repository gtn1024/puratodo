import type { RecurrenceEditorValue, RecurrenceUpdateScope, TaskUpdatePayload } from '@puratodo/task-ui'
import { createRecurrenceEditorValue, TaskDetailDrawer } from '@puratodo/task-ui'
import { Button } from '@puratodo/ui'
import { FileText, Loader2, Star, X } from 'lucide-react'
import * as React from 'react'
import { useI18n } from '@/i18n'
import { useDataStore } from '@/stores/dataStore'

interface TaskDetailPanelProps {
  taskId: string | null
  onTaskUpdated: () => void
  onClose: () => void
}

export function TaskDetailPanel({ taskId, onTaskUpdated, onClose }: TaskDetailPanelProps) {
  const { t } = useI18n()
  const { tasks, updateTask } = useDataStore()

  // Find the task from store
  const task = taskId ? tasks.find(t => t.id === taskId) : null

  // Recurrence and reminder state
  const defaultRecurrence: RecurrenceEditorValue = {
    frequency: '',
    interval: '',
    weekdays: [],
    endType: 'never',
    endDate: undefined,
    endCount: '',
    rule: '',
    timezone: '',
  }
  const [recurrence, setRecurrence] = React.useState<RecurrenceEditorValue>(defaultRecurrence)
  const [recurrenceScope, setRecurrenceScope] = React.useState<RecurrenceUpdateScope>('single')
  const [remindAt, setRemindAt] = React.useState<string | null>(null)
  const [isLoaded, setIsLoaded] = React.useState(false)

  // Load task data when taskId changes
  React.useEffect(() => {
    if (!taskId) {
      setIsLoaded(false)
      setRecurrence(defaultRecurrence)
      setRemindAt(null)
      return
    }

    const foundTask = tasks.find(t => t.id === taskId)
    if (foundTask) {
      setRecurrence(createRecurrenceEditorValue(foundTask))
      setRemindAt(foundTask.remind_at || null)
      setIsLoaded(true)
    }
    else {
      setIsLoaded(false)
    }
  }, [taskId, tasks])

  const handleSave = async (updates: TaskUpdatePayload) => {
    if (!task)
      return

    try {
      await updateTask(task.id, updates)
      onTaskUpdated()
    }
    catch (err) {
      console.error('Failed to save task:', err)
      throw err
    }
  }

  const handleOpenUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const toggleStarred = async () => {
    if (!task)
      return
    try {
      await updateTask(task.id, { starred: !task.starred })
      onTaskUpdated()
    }
    catch (err) {
      console.error('Failed to toggle star:', err)
    }
  }

  const toggleCompleted = async () => {
    if (!task)
      return
    try {
      await updateTask(task.id, { completed: !task.completed })
      onTaskUpdated()
    }
    catch (err) {
      console.error('Failed to toggle completion:', err)
    }
  }

  // Empty state - no task selected
  if (!taskId) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center border-l border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
        <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-stone-400" />
        </div>
        <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">
          {t('app.noTaskSelected')}
        </h3>
        <p className="text-sm text-stone-500 dark:text-stone-400 max-w-xs">
          {t('app.clickTaskToView')}
        </p>
      </div>
    )
  }

  // Loading state
  if (!isLoaded || !task) {
    return (
      <div className="h-full flex items-center justify-center border-l border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
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
        {/* Completed and Starred toggles - app-specific */}
        <div className="px-6 pt-6">
          <div className="flex items-center gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer hover:border-green-500 ${
                  task.completed
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-stone-300 dark:border-stone-600'
                }`}
                onClick={toggleCompleted}
              >
                {task.completed && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-stone-700 dark:text-stone-300">
                {task.completed ? t('taskDetail.completed') : t('taskDetail.markComplete')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleStarred}
                className={`p-1 rounded ${
                  task.starred ? 'text-yellow-500' : 'text-stone-300 dark:text-stone-600'
                }`}
              >
                <Star className="w-5 h-5" fill={task.starred ? 'currentColor' : 'none'} />
              </button>
              <span className="text-sm text-stone-700 dark:text-stone-300">
                {task.starred ? t('taskDetail.starred') : t('taskDetail.star')}
              </span>
            </div>
          </div>
        </div>

        {/* TaskDetailDrawer - shared component */}
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
            taskName: t('taskDetail.taskName'),
            taskNamePlaceholder: t('taskDetail.enterTaskName'),
            dueDate: t('taskDetail.dueDate'),
            planDate: t('taskDetail.planDate'),
            duration: t('taskDetail.duration'),
            durationPlaceholder: t('taskDetail.durationPlaceholder'),
            url: t('taskDetail.url'),
            urlPlaceholder: t('taskDetail.urlPlaceholder'),
            openUrl: t('taskDetail.openUrl'),
            comment: t('taskDetail.notes'),
            commentPlaceholder: t('taskDetail.notesPlaceholder'),
            selectDueDate: t('taskDetail.selectDueDate'),
            selectPlanDate: t('taskDetail.selectPlanDate'),
            clear: t('taskDetail.clear'),
            save: t('taskDetail.save'),
            cancel: t('taskDetail.close'),
            loading: t('common.loading'),
            taskNotFound: t('errors.taskNotFound'),

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
