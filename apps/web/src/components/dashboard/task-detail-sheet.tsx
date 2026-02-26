'use client'

import type { TaskUpdatePayload } from '@puratodo/task-ui'
import type { Task } from '@/actions/tasks'
import type { RecurrenceEditorValue, RecurrenceUpdateScope } from '@/components/dashboard/recurrence-fields'
import {
  createRecurrenceEditorValue,
  TaskDetailForm,
} from '@puratodo/task-ui'
import { useEffect, useState } from 'react'
import { getTaskById, updateTask } from '@/actions/tasks'
import {

  RecurrenceFields,

} from '@/components/dashboard/recurrence-fields'
import { ReminderFields } from '@/components/dashboard/reminder-fields'
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
  const [recurrenceScope, setRecurrenceScope]
    = useState<RecurrenceUpdateScope>('single')
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

        <TaskDetailForm
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
          }}
          RecurrenceEditor={RecurrenceFields}
          ReminderEditor={ReminderFields}
        />
      </SheetContent>
    </Sheet>
  )
}
