import type { RecurrenceEditorValue, RecurrenceUpdateScope, TaskUpdatePayload } from '@puratodo/task-ui'
import { createRecurrenceEditorValue, TaskDetailDrawer } from '@puratodo/task-ui'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@puratodo/ui'
import * as React from 'react'
import { useI18n } from '@/i18n'
import { useDataStore } from '@/stores/dataStore'

interface TaskDetailSheetProps {
  taskId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdated: () => void
}

function TaskDetailSheetContent({
  taskId,
  onTaskUpdated,
  onClose,
}: {
  taskId: string | null
  onTaskUpdated: () => void
  onClose: () => void
}) {
  const { tasks, updateTask } = useDataStore()
  const { t } = useI18n()

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

  // Load recurrence and remindAt data when taskId changes
  React.useEffect(() => {
    if (!taskId) {
      setRecurrence(defaultRecurrence)
      setRemindAt(null)
      return
    }

    const foundTask = tasks.find(t => t.id === taskId)
    if (foundTask) {
      setRecurrence(createRecurrenceEditorValue(foundTask))
      setRemindAt(foundTask.remind_at || null)
    }
  }, [taskId, tasks])

  const handleSave = async (updates: TaskUpdatePayload) => {
    if (!task)
      return

    try {
      await updateTask(task.id, updates)
      onTaskUpdated()
      onClose()
    }
    catch (err) {
      console.error('Failed to save task:', err)
      throw err
    }
  }

  const handleOpenUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
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
  )
}

export function TaskDetailSheet({
  taskId,
  open,
  onOpenChange,
  onTaskUpdated,
}: TaskDetailSheetProps) {
  const { t } = useI18n()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] rounded-t-xl p-0"
        showCloseButton={false}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{t('taskSheet.taskDetails')}</SheetTitle>
          <SheetDescription>{t('taskSheet.editTaskDetails')}</SheetDescription>
        </SheetHeader>
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700" />
        </div>
        <TaskDetailSheetContent
          taskId={taskId}
          onTaskUpdated={onTaskUpdated}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
