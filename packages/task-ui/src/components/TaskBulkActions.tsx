import { Button } from '@puratodo/ui'
import {
  Calendar,
  CheckCircle,
  Circle,
  Star as StarIcon,
  Trash2,
  X,
} from 'lucide-react'
import * as React from 'react'

export interface TaskBulkActionsProps {
  /**
   * Number of selected tasks
   */
  selectedCount: number

  /**
   * Callback when "Select All" is clicked
   */
  onSelectAll: () => void

  /**
   * Callback when "Deselect" is clicked
   */
  onDeselectAll: () => void

  /**
   * Callback when "Complete" is clicked
   */
  onComplete: () => void

  /**
   * Callback when "Incomplete" is clicked
   */
  onIncomplete: () => void

  /**
   * Callback when "Star" is clicked
   */
  onStar: () => void

  /**
   * Callback when "Unstar" is clicked
   */
  onUnstar: () => void

  /**
   * Callback when "Delete" is clicked
   */
  onDelete: () => void

  /**
   * Callback when "Set Date" is clicked
   */
  onSetDate: () => void

  /**
   * Callback when "Cancel" is clicked (exits selection mode)
   */
  onCancel: () => void

  /**
   * Translation labels for i18n
   */
  labels?: {
    tasksSelected?: string
    selectAll?: string
    deselect?: string
    complete?: string
    incomplete?: string
    star?: string
    unstar?: string
    delete?: string
    setDate?: string
    cancel?: string
  }
}

const defaultLabels = {
  tasksSelected: 'tasks selected',
  selectAll: 'Select All',
  deselect: 'Deselect',
  complete: 'Complete',
  incomplete: 'Incomplete',
  star: 'Star',
  unstar: 'Unstar',
  delete: 'Delete',
  setDate: 'Set Date',
  cancel: 'Cancel',
}

export function TaskBulkActions({
  selectedCount,
  onSelectAll,
  onDeselectAll,
  onComplete,
  onIncomplete,
  onStar,
  onUnstar,
  onDelete,
  onSetDate,
  onCancel,
  labels: userLabels,
}: TaskBulkActionsProps) {
  const labels = { ...defaultLabels, ...userLabels }

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-t border-b border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
          {selectedCount}
          {' '}
          {labels.tasksSelected}
        </span>
        <Button variant="ghost" size="sm" onClick={onSelectAll}>
          {labels.selectAll}
        </Button>
        <Button variant="ghost" size="sm" onClick={onDeselectAll}>
          {labels.deselect}
        </Button>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onComplete}
          className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          {labels.complete}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onIncomplete}
          className="text-stone-600 dark:text-stone-400"
        >
          <Circle className="h-4 w-4 mr-1" />
          {labels.incomplete}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onStar}
          className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300"
        >
          <StarIcon className="h-4 w-4 mr-1" />
          {labels.star}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onUnstar}
          className="text-stone-600 dark:text-stone-400"
        >
          <StarIcon className="h-4 w-4 mr-1" />
          {labels.unstar}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          {labels.delete}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onSetDate}
        >
          <Calendar className="h-4 w-4 mr-1" />
          {labels.setDate}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
        >
          <X className="h-4 w-4 mr-1" />
          {labels.cancel}
        </Button>
      </div>
    </div>
  )
}
