'use client'

import type { Task } from '@/actions/tasks'
import { formatParsedTask, parseTaskInput, type ParsedTask } from '@/lib/nlp-parser'
import { Calendar, Clock, ListPlus, Plus, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n'

interface SmartTaskInputProps {
  onAddTask: (parsed: {
    name: string
    due_date?: string | null
    plan_date?: string | null
    duration_minutes?: number | null
    starred?: boolean
    subtasks?: string[]
  }) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  placeholder?: string
}

export function SmartTaskInput({ onAddTask, onCancel, isLoading, placeholder }: SmartTaskInputProps) {
  const { t, locale } = useI18n()
  const [input, setInput] = useState('')
  const [parsed, setParsed] = useState<ParsedTask | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Parse input as user types (debounced)
  useEffect(() => {
    const trimmed = input.trim()
    if (!trimmed) {
      setParsed(null)
      setShowPreview(false)
      return
    }

    // Only show preview after a short delay to avoid flickering
    const timer = setTimeout(() => {
      const result = parseTaskInput(trimmed)
      setParsed(result)
      // Show preview if we detected any structured data
      setShowPreview(result.detectedHints.length > 0)
    }, 150)

    return () => clearTimeout(timer)
  }, [input])

  const handleAdd = async () => {
    if (!input.trim())
      return

    const parsedData = parsed || parseTaskInput(input.trim())

    await onAddTask({
      name: parsedData.title,
      due_date: parsedData.due_date,
      plan_date: parsedData.plan_date,
      duration_minutes: parsedData.duration_minutes,
      starred: parsedData.starred,
      subtasks: parsedData.subtasks,
    })

    setInput('')
    setParsed(null)
    setShowPreview(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
    else if (e.key === 'Escape') {
      setInput('')
      setParsed(null)
      setShowPreview(false)
      onCancel()
    }
  }

  const hasStructuredData = parsed && parsed.detectedHints.length > 0

  return (
    <div className="space-y-2">
      {/* Main Input */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
        <div className="h-5 w-5 rounded-full border-2 border-stone-300 dark:border-stone-600 flex-shrink-0" />
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || t('smartInput.placeholder')}
          className="flex-1 bg-transparent outline-none text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
          autoFocus
          disabled={isLoading}
        />
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={isLoading || !input.trim()}
        >
          <Plus className="h-4 w-4 mr-1" />
          {t('common.add')}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
        >
          {t('common.cancel')}
        </Button>
      </div>

      {/* Parse Preview */}
      {showPreview && parsed && hasStructuredData && (
        <div className="mx-4 px-4 py-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <div className="text-xs text-blue-600 dark:text-blue-400 mb-2 font-medium">
            {t('smartInput.detected')}
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Title Preview */}
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white dark:bg-stone-800 text-sm">
              <span className="text-stone-600 dark:text-stone-400">
                {parsed.title}
              </span>
            </div>

            {/* Due Date */}
            {parsed.due_date && (
              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs">
                <Calendar className="h-3 w-3" />
                <span>{t('taskDetail.dueDate')}: {parsed.due_date}</span>
              </div>
            )}

            {/* Plan Date */}
            {parsed.plan_date && (
              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs">
                <Calendar className="h-3 w-3" />
                <span>{t('taskDetail.planDate')}: {parsed.plan_date}</span>
              </div>
            )}

            {/* Duration */}
            {parsed.duration_minutes && (
              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs">
                <Clock className="h-3 w-3" />
                <span>{parsed.duration_minutes} {t('taskDetail.duration').toLowerCase()}</span>
              </div>
            )}

            {/* Starred */}
            {parsed.starred && (
              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs">
                <Star className="h-3 w-3 fill-current" />
                <span>{t('sidebar.starred')}</span>
              </div>
            )}

            {/* Subtasks */}
            {parsed.subtasks.length > 0 && (
              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs">
                <ListPlus className="h-3 w-3" />
                <span>+{parsed.subtasks.length} {t('taskPanel.addSubtask').toLowerCase()}</span>
              </div>
            )}
          </div>

          {/* Hint Text */}
          <div className="mt-2 text-xs text-blue-500 dark:text-blue-500">
            {t('smartInput.hint')}
          </div>
        </div>
      )}

      {/* Examples (when input is empty) */}
      {!input && (
        <div className="mx-4 text-xs text-stone-400 dark:text-stone-500">
          <span className="font-medium">{t('smartInput.examples')}:</span>
          <span className="ml-1">"{t('smartInput.example1')}"</span>
          <span className="mx-1">•</span>
          <span>"{t('smartInput.example2')}"</span>
          <span className="mx-1">•</span>
          <span>"{t('smartInput.example3')}"</span>
        </div>
      )}
    </div>
  )
}
