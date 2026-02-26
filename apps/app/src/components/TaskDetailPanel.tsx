import { getLocalDateString, parseLocalDateString } from '@puratodo/shared'
import { Button } from '@puratodo/ui'
import { CalendarIcon, Clock, FileText, Loader2, Star, X } from 'lucide-react'
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

  // Local state for editing
  const [name, setName] = React.useState('')
  const [dueDate, setDueDate] = React.useState<Date | undefined>()
  const [planDate, setPlanDate] = React.useState<Date | undefined>()
  const [comment, setComment] = React.useState('')
  const [durationMinutes, setDurationMinutes] = React.useState<string>('')
  const [isSaving, setIsSaving] = React.useState(false)
  const [isLoaded, setIsLoaded] = React.useState(false)

  // Load task data when taskId changes
  React.useEffect(() => {
    if (!taskId) {
      setIsLoaded(false)
      return
    }

    const foundTask = tasks.find(t => t.id === taskId)
    if (foundTask) {
      setName(foundTask.name)
      setDueDate(parseLocalDateString(foundTask.due_date))
      setPlanDate(parseLocalDateString(foundTask.plan_date))
      setComment(foundTask.comment || '')
      setDurationMinutes(foundTask.duration_minutes?.toString() || '')
      setIsLoaded(true)
    }
    else {
      setIsLoaded(false)
    }
  }, [taskId, tasks])

  const handleSave = async () => {
    if (!task || !name.trim())
      return

    setIsSaving(true)
    try {
      await updateTask(task.id, {
        name: name.trim(),
        due_date: dueDate ? getLocalDateString(dueDate) : null,
        plan_date: planDate ? getLocalDateString(planDate) : null,
        comment: comment.trim() || null,
        duration_minutes: durationMinutes ? Number.parseInt(durationMinutes, 10) : null,
      })
      onTaskUpdated()
    }
    catch (err) {
      console.error('Failed to save task:', err)
    }
    finally {
      setIsSaving(false)
    }
  }

  const clearDueDate = () => setDueDate(undefined)
  const clearPlanDate = () => setPlanDate(undefined)

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
        <div className="p-6 space-y-6">
          {/* Task Name */}
          <div className="space-y-2">
            <label className="font-medium text-stone-700 dark:text-stone-300">
              {t('taskDetail.taskName')}
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('taskDetail.enterTaskName')}
              className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>

          {/* Completed and Starred Status */}
          <div className="flex items-center gap-4">
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

          {/* Due Date */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 font-medium text-stone-700 dark:text-stone-300">
                <CalendarIcon className="h-4 w-4 text-stone-500 dark:text-stone-400" />
                {t('taskDetail.dueDate')}
              </label>
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
            <input
              type="date"
              value={dueDate ? getLocalDateString(dueDate) : ''}
              onChange={(e) => {
                const newDate = parseLocalDateString(e.target.value)
                setDueDate(newDate)
              }}
              className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Plan Date */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 font-medium text-stone-700 dark:text-stone-300">
                <CalendarIcon className="h-4 w-4 text-stone-500 dark:text-stone-400" />
                {t('taskDetail.planDate')}
              </label>
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
            <input
              type="date"
              value={planDate ? getLocalDateString(planDate) : ''}
              onChange={(e) => {
                const newDate = parseLocalDateString(e.target.value)
                setPlanDate(newDate)
              }}
              className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-medium text-stone-700 dark:text-stone-300">
              <Clock className="h-4 w-4 text-stone-500 dark:text-stone-400" />
              {t('taskDetail.duration')}
            </label>
            <input
              type="number"
              min="0"
              value={durationMinutes}
              onChange={e => setDurationMinutes(e.target.value)}
              placeholder={t('taskDetail.durationPlaceholder')}
              className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-medium text-stone-700 dark:text-stone-300">
              <FileText className="h-4 w-4 text-stone-500 dark:text-stone-400" />
              {t('taskDetail.notes')}
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder={t('taskDetail.notesPlaceholder')}
              rows={4}
              className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 resize-none"
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
                    {t('taskDetail.saving')}
                  </>
                )
              : (
                  t('taskDetail.save')
                )}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            {t('taskDetail.close')}
          </Button>
        </div>
      </div>
    </div>
  )
}
