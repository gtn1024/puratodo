'use client'

import { parseLocalDateString } from '@puratodo/shared'
import { cn, Dialog, DialogContent, Input } from '@puratodo/ui'
import { format } from 'date-fns'
import { Calendar, Check, Circle, Loader2, Search, Star } from 'lucide-react'
import * as React from 'react'

/**
 * Search result item structure
 */
export interface SearchResult {
  id: string
  name: string
  completed: boolean
  starred: boolean
  due_date: string | null
  list_id: string
  list_name: string
  list_icon: string
  group_name: string
  group_color: string
}

/**
 * Labels for i18n support
 */
export interface CommandPaletteLabels {
  title: string
  placeholder: string
  emptyPrompt: string
  searching: string
  noResults: string
  escToClose: string
}

/**
 * Props for CommandPalette component
 */
export interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSearch: (query: string) => Promise<SearchResult[]>
  onSelect: (result: SearchResult) => void
  labels?: Partial<CommandPaletteLabels>
  className?: string
}

const DEFAULT_LABELS: CommandPaletteLabels = {
  title: 'Search Tasks',
  placeholder: 'Search tasks...',
  emptyPrompt: 'Type to search your tasks',
  searching: 'Searching...',
  noResults: 'No tasks found',
  escToClose: 'Press Esc to close',
}

/**
 * CommandPalette (Search Dialog) component
 *
 * A reusable search dialog component with keyboard shortcut support.
 * Abstracts the search UI while delegating search logic to the parent via onSearch callback.
 *
 * Features:
 * - Debounced search (300ms)
 * - Keyboard navigation support
 * - Loading states
 * - Empty states
 * - i18n support via labels
 */
export function CommandPalette({
  open,
  onOpenChange,
  onSearch,
  onSelect,
  labels: labelsProp,
  className,
}: CommandPaletteProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp }
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  // Debounced search
  React.useEffect(() => {
    if (!open)
      return

    if (!query.trim()) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const data = await onSearch(query)
        setResults(data)
      }
      catch (error) {
        console.error('Search error:', error)
        setResults([])
      }
      setIsLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, open, onSearch])

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
    }
  }, [open])

  const handleSelect = React.useCallback(
    (result: SearchResult) => {
      onSelect(result)
      onOpenChange(false)
    },
    [onSelect, onOpenChange],
  )

  const getDueDateLabel = React.useCallback((dueDate: string | null) => {
    const parsed = parseLocalDateString(dueDate)
    return parsed ? format(parsed, 'MMM d') : null
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-lg p-0 gap-0 ${className || ''}`}>
        {/* Visually hidden title for accessibility */}
        <div className="sr-only">
          <h2>{labels.title}</h2>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Search className="h-4 w-4 text-stone-400 flex-shrink-0" />
          <Input
            placeholder={labels.placeholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 px-0 h-9"
            autoFocus
          />
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-stone-400" />}
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto">
          {query.trim() === '' ? (
            <div className="py-8 text-center text-sm text-stone-500">
              {labels.emptyPrompt}
            </div>
          ) : isLoading ? (
            <div className="py-8 text-center text-sm text-stone-500">
              {labels.searching}
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-sm text-stone-500">
              {labels.noResults}
              {' '}
              for &ldquo;
              {query}
              &rdquo;
            </div>
          ) : (
            <ul className="py-1">
              {results.map((result) => {
                const dueDateLabel = getDueDateLabel(result.due_date)
                return (
                  <li
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    className="px-4 py-2 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {/* Completion status */}
                      {result.completed
                        ? (
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          )
                        : (
                            <Circle className="h-4 w-4 text-stone-300 dark:text-stone-600 flex-shrink-0" />
                          )}

                      {/* Task name */}
                      <span
                        className={cn(
                          'flex-1 truncate text-sm',
                          result.completed
                            ? 'line-through text-stone-400'
                            : 'text-stone-900 dark:text-stone-100',
                        )}
                      >
                        {result.name}
                      </span>

                      {/* Star indicator */}
                      {result.starred && (
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
                      )}

                      {/* Due date */}
                      {dueDateLabel && (
                        <div className="flex items-center gap-1 text-xs text-stone-500">
                          <Calendar className="h-3 w-3" />
                          {dueDateLabel}
                        </div>
                      )}
                    </div>

                    {/* Location info */}
                    <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5 pl-6">
                      <span>{result.list_icon}</span>
                      <span className="truncate">{result.list_name}</span>
                      <span className="text-stone-300 dark:text-stone-600">/</span>
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: result.group_color }}
                      />
                      <span className="truncate">{result.group_name}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-2 text-xs text-stone-400 text-center">
          {labels.escToClose}
          {' '}
          <kbd className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 rounded">Esc</kbd>
        </div>
      </DialogContent>
    </Dialog>
  )
}
