'use client'

import type { RecurrenceEditorValue, RecurrenceUpdateScope, TaskUpdatePayload } from '@puratodo/task-ui'
import type { Task } from '@/actions/tasks'
import { createRecurrenceEditorValue, TaskDetailDrawer } from '@puratodo/task-ui'
import { useEffect, useState } from 'react'
import { getTaskById, updateTask } from '@/actions/tasks'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useI18n } from '@/i18n'

interface TaskDetailSheetProps {
  task: Task | null
  taskId?: string | null // Alternative: pass just the ID
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdated: () => void
}

export function TaskDetailSheet({
  task: initialTask,
  taskId,
  open,
  onOpenChange,
  onTaskUpdated,
}: TaskDetailSheetProps) {
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

  // Load task data when task changes
  useEffect(() => {
    async function loadTask() {
      // If we have a taskId but no task, or the task id doesn't match, load it
      const effectiveTaskId = taskId || initialTask?.id

      if (effectiveTaskId && (!initialTask || initialTask.id !== effectiveTaskId)) {
        setIsLoading(true)
        const loadedTask = await getTaskById(effectiveTaskId)
        setTask(loadedTask)
        if (loadedTask) {
          setRecurrence(createRecurrenceEditorValue(loadedTask))
          setRecurrenceScope('single')
          setRemindAt(loadedTask.remind_at)
        }
        setIsLoading(false)
      }
      else if (initialTask) {
        setTask(initialTask)
        setRecurrence(createRecurrenceEditorValue(initialTask))
        setRecurrenceScope('single')
        setRemindAt(initialTask.remind_at)
      }
    }

    if (open) {
      loadTask()
    }
  }, [initialTask, taskId, open])

  const handleSave = async (updates: TaskUpdatePayload) => {
    if (!task)
      return

    const result = await updateTask(task.id, updates)

    if (result.success) {
      onTaskUpdated()
      onOpenChange(false)
    }
  }

  const effectiveTaskId = taskId || initialTask?.id
  if (!effectiveTaskId)
    return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[85%] sm:w-[400px] md:w-[500px] lg:w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('taskDetail.taskDetails')}</SheetTitle>
          <SheetDescription>
            View and edit task information
          </SheetDescription>
        </SheetHeader>

        <TaskDetailDrawer
          task={task}
          isLoading={isLoading}
          onSave={handleSave}
          onCancel={() => onOpenChange(false)}
          recurrence={recurrence}
          onRecurrenceChange={setRecurrence}
          recurrenceScope={recurrenceScope}
          onRecurrenceScopeChange={setRecurrenceScope}
          remindAt={remindAt}
          onRemindAtChange={setRemindAt}
          onOpenUrl={url => window.open(url, '_blank', 'noopener,noreferrer')}
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
      </SheetContent>
    </Sheet>
  )
}
