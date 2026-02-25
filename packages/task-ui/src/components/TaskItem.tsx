'use client'

import type { TaskWithSubtasks } from '@puratodo/api-types'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, Checkbox, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@puratodo/ui'
import {
  CheckSquare,
  ChevronDown,
  ChevronRight,
  GripVertical,
  MoreHorizontal,
  Plus,
  Square,
  Star,
} from 'lucide-react'
import * as React from 'react'

export interface TaskContextMeta {
  listName: string
  listIcon: string
  groupName: string
  groupColor: string
}

export interface InboxMoveTarget {
  listId: string
  listName: string
  listIcon?: string
  groupName: string
}

export interface TaskItemProps {
  task: TaskWithSubtasks
  level: number
  expandedTasks: Set<string>
  onToggleExpand: (taskId: string) => void
  onToggleComplete: (task: TaskWithSubtasks) => void
  onToggleStar: (task: TaskWithSubtasks) => void
  onEdit: (task: TaskWithSubtasks) => void
  onDelete: (task: TaskWithSubtasks) => void
  onAddSubtask: (task: TaskWithSubtasks) => void
  onOpenDetail: (task: TaskWithSubtasks) => void
  editingTaskId: string | null
  editName: string
  onEditNameChange: (name: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  canMoveFromInbox?: boolean
  moveTargets?: InboxMoveTarget[]
  onMoveToList?: (task: TaskWithSubtasks, targetListId: string) => void
  disableSorting?: boolean
  allowSubtaskActions?: boolean
  contextMeta?: TaskContextMeta
  renderSubtasks: (task: TaskWithSubtasks, level: number) => React.ReactNode
  // Multi-select props
  isSelectionMode?: boolean
  isSelected?: boolean
  onToggleSelect?: (taskId: string) => void
  // Translation labels for i18n
  labels?: {
    edit?: string
    addSubtask?: string
    moveTo?: string
    delete?: string
  }
}

// Default labels for i18n
const defaultLabels = {
  edit: 'Edit',
  addSubtask: 'Add Subtask',
  moveTo: 'Move to...',
  delete: 'Delete',
}

export function TaskItem({
  task,
  level,
  expandedTasks,
  onToggleExpand,
  onToggleComplete,
  onToggleStar,
  onEdit,
  onDelete,
  onAddSubtask,
  onOpenDetail,
  editingTaskId,
  editName,
  onEditNameChange,
  onSaveEdit,
  onCancelEdit,
  canMoveFromInbox,
  moveTargets,
  onMoveToList,
  disableSorting,
  allowSubtaskActions,
  contextMeta,
  renderSubtasks,
  isSelectionMode,
  isSelected,
  onToggleSelect,
  labels: userLabels,
}: TaskItemProps) {
  const labels = { ...defaultLabels, ...userLabels }
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: disableSorting })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isEditing = editingTaskId === task.id
  const hasSubtasks = task.subtasks && task.subtasks.length > 0
  const isExpanded = expandedTasks.has(task.id)
  const showInboxMoveMenu
    = Boolean(canMoveFromInbox && level === 0 && onMoveToList)
      && (moveTargets?.length || 0) > 0

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSaveEdit()
    }
    else if (e.key === 'Escape') {
      onCancelEdit()
    }
  }

  const paddingLeft = level * 24

  return (
    <>
      <li
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group"
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={() => onToggleExpand(task.id)}
          className={`w-4 h-4 flex items-center justify-center ${
            hasSubtasks ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {hasSubtasks
            && (isExpanded
              ? (
                  <ChevronDown className="h-4 w-4 text-stone-500" />
                )
              : (
                  <ChevronRight className="h-4 w-4 text-stone-500" />
                ))}
        </button>

        {/* Drag Handle */}
        {disableSorting
          ? (
              <span
                style={{ marginLeft: paddingLeft }}
                className="w-4 h-4"
                aria-hidden
              />
            )
          : (
              <button
                {...attributes}
                {...listeners}
                style={{ marginLeft: paddingLeft }}
                className="cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <GripVertical className="h-4 w-4" />
              </button>
            )}

        {/* Selection Checkbox (shown in selection mode) */}
        {isSelectionMode && (
          <button
            onClick={() => onToggleSelect?.(task.id)}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
          >
            {isSelected
              ? (
                  <CheckSquare className="h-4 w-4 text-blue-500" />
                )
              : (
                  <Square className="h-4 w-4" />
                )}
          </button>
        )}

        {/* Checkbox */}
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggleComplete(task)}
          className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 data-[state=checked]:text-white"
        />

        {/* Task Name or Edit Input */}
        {isEditing
          ? (
              <input
                type="text"
                value={editName}
                onChange={e => onEditNameChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent outline-none border-b border-stone-300 dark:border-stone-600 text-stone-900 dark:text-stone-100"
                autoFocus
              />
            )
          : (
              <span
                onClick={() => onOpenDetail(task)}
                className={`flex-1 cursor-pointer hover:underline ${
                  task.completed
                    ? 'text-stone-400 dark:text-stone-500 line-through'
                    : 'text-stone-900 dark:text-stone-100'
                }`}
              >
                {task.name}
              </span>
            )}

        {contextMeta && level === 0 && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
            <span>{contextMeta.listIcon || '📋'}</span>
            <span className="max-w-[10rem] truncate">{contextMeta.listName}</span>
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: contextMeta.groupColor || '#6b7280' }}
            />
            <span className="max-w-[7rem] truncate">{contextMeta.groupName}</span>
          </span>
        )}

        {/* Star Button */}
        <button
          onClick={() => onToggleStar(task)}
          className={`opacity-0 group-hover:opacity-100 transition-opacity ${
            task.starred
              ? 'opacity-100 text-yellow-500'
              : 'text-stone-400 hover:text-yellow-500'
          }`}
        >
          <Star
            className={`h-4 w-4 ${task.starred ? 'fill-yellow-500' : ''}`}
          />
        </button>

        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="h-7 w-7 opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              {labels.edit}
            </DropdownMenuItem>
            {allowSubtaskActions !== false && (
              <DropdownMenuItem onClick={() => onAddSubtask(task)}>
                <Plus className="h-4 w-4 mr-2" />
                {labels.addSubtask}
              </DropdownMenuItem>
            )}
            {showInboxMoveMenu && (
              <>
                <DropdownMenuItem disabled className="text-xs text-stone-500">
                  {labels.moveTo}
                </DropdownMenuItem>
                {moveTargets?.map(target => (
                  <DropdownMenuItem
                    key={target.listId}
                    onClick={() => onMoveToList?.(task, target.listId)}
                    className="flex items-center gap-2"
                  >
                    <span>{target.listIcon || '📋'}</span>
                    <span className="truncate">{target.listName}</span>
                    <span className="ml-auto text-[10px] text-stone-400 truncate">
                      {target.groupName}
                    </span>
                  </DropdownMenuItem>
                ))}
              </>
            )}
            <DropdownMenuItem
              onClick={() => onDelete(task)}
              className="text-red-600 dark:text-red-400"
            >
              {labels.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </li>

      {/* Subtasks */}
      {isExpanded && hasSubtasks && renderSubtasks(task, level)}
    </>
  )
}
