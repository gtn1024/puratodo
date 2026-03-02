'use client'

import type { ParsedTask, TaskTreeItem } from '@/lib/batch-task-parser'
import { AlertCircle, Circle, Loader2, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useI18n } from '@/i18n'
import { buildTaskTree, parseBatchTasks } from '@/lib/batch-task-parser'

interface BatchAddTasksDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateTasks: (tasks: ParsedTask[]) => Promise<void>
  isLoading?: boolean
}

export function BatchAddTasksDialog({ open, onOpenChange, onCreateTasks, isLoading }: BatchAddTasksDialogProps) {
  const { t } = useI18n()
  const [input, setInput] = useState('')
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([])
  const [taskTree, setTaskTree] = useState<TaskTreeItem[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)

  // Parse input whenever it changes
  useEffect(() => {
    if (!input.trim()) {
      setParsedTasks([])
      setTaskTree([])
      setErrors([])
      return
    }

    const result = parseBatchTasks(input)
    setParsedTasks(result.tasks)
    setTaskTree(buildTaskTree(result.tasks))
    setErrors(result.errors)
  }, [input])

  const handleCreate = async () => {
    // Filter out tasks with errors
    const validTasks = parsedTasks.filter(task => !task.hasError)
    if (validTasks.length === 0) {
      return
    }

    await onCreateTasks(validTasks)

    // Reset and close
    setInput('')
    setParsedTasks([])
    setTaskTree([])
    setErrors([])
    setShowPreview(false)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setInput('')
    setParsedTasks([])
    setTaskTree([])
    setErrors([])
    setShowPreview(false)
    onOpenChange(false)
  }

  const validTaskCount = parsedTasks.filter(t => !t.hasError).length

  // Render a task tree item recursively
  const renderTaskItem = useCallback((item: TaskTreeItem, depth = 0): React.ReactNode => {
    const indentClass = depth > 0 ? `ml-${Math.min(depth * 4, 16)}` : ''

    return (
      <div key={item.lineNumber} className={indentClass}>
        <div className={`flex items-start gap-2 py-1 px-2 rounded ${item.hasError ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
          {item.hasError
            ? (
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              )
            : (
                <Circle className="h-4 w-4 text-stone-400 mt-0.5 flex-shrink-0" />
              )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={item.hasError ? 'text-red-700 dark:text-red-400' : 'text-stone-900 dark:text-stone-100'}>
                {item.name || <em className="text-stone-400">empty</em>}
              </span>
              {item.durationMinutes && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                  {item.durationMinutes}
                  m
                </span>
              )}
            </div>
            {item.hasError && item.errorMessage && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{item.errorMessage}</p>
            )}
          </div>
        </div>
        {item.children.length > 0 && (
          <div className="ml-4">
            {item.children.map(child => renderTaskItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }, [])

  const exampleInput = `Project kickoff meeting [1h]
  Prepare agenda [30m]
  Send invitations [15m]
  Book conference room
Review documentation 45min
  Read user guide
  Complete tutorial`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('batchAdd.title')}</DialogTitle>
          <DialogDescription>
            {t('batchAdd.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Input textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{t('batchAdd.inputLabel')}</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInput(exampleInput)}
                className="text-xs"
              >
                {t('batchAdd.fillExample')}
              </Button>
            </div>
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={t('batchAdd.placeholder')}
              className="min-h-[120px] font-mono text-sm resize-none"
              autoFocus
            />
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span>{t('batchAdd.tasksCount').replace('{count}', String(validTaskCount))}</span>
              {errors.length > 0 && (
                <span className="text-red-500">{t('batchAdd.errorsCount').replace('{count}', String(errors.length))}</span>
              )}
            </div>
          </div>

          {/* Preview */}
          {parsedTasks.length > 0 && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">{t('batchAdd.preview')}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-xs"
                >
                  {showPreview ? t('batchAdd.hidePreview') : t('batchAdd.showPreview')}
                </Button>
              </div>
              {showPreview && (
                <div className="flex-1 overflow-y-auto border rounded-lg p-3 bg-stone-50 dark:bg-stone-900/50">
                  {taskTree.length === 0
                    ? (
                        <div className="text-center text-stone-500 dark:text-stone-400 py-8">
                          {t('batchAdd.noTasks')}
                        </div>
                      )
                    : (
                        <div className="space-y-1">
                          {taskTree.map(item => renderTaskItem(item))}
                        </div>
                      )}
                </div>
              )}

              {/* Errors */}
              {errors.length > 0 && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="text-sm font-medium mb-1">{t('batchAdd.parseErrors')}</div>
                    <ul className="text-xs space-y-0.5 list-disc list-inside">
                      {errors.slice(0, 5).map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                      {errors.length > 5 && (
                        <li className="text-stone-600 dark:text-stone-400">
                          {t('batchAdd.moreErrors').replace('{count}', String(errors.length - 5))}
                        </li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Help text */}
          <div className="text-xs text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 rounded-lg p-3">
            <div className="font-medium mb-1">
              {t('batchAdd.help.title')}
              :
            </div>
            <ul className="space-y-0.5 ml-4 list-disc">
              <li>{t('batchAdd.help.nesting')}</li>
              <li>{t('batchAdd.help.duration')}</li>
              <li>{t('batchAdd.help.bullets')}</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isLoading || validTaskCount === 0 || parsedTasks.some(t => t.hasError)}
          >
            {isLoading
              ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('batchAdd.creating')}
                  </>
                )
              : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('batchAdd.create').replace('{count}', String(validTaskCount))}
                  </>
                )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
