'use client'

import type { InboxMoveTarget, TaskContextMeta, TaskFiltersValue } from '@puratodo/task-ui'
import type { List } from '@/actions/lists'
import type { ParsedTask, Task, TaskSearchResult } from '@/actions/tasks'
import { getLocalDateString } from '@puratodo/shared'
import {
  TaskFilters as SharedTaskFilters,
  TaskBulkActions,
  TaskList,
} from '@puratodo/task-ui'
import {
  CheckCircle,
  CheckSquare,
  Circle,
  Filter,
  List as ListIcon,
  Plus,
} from 'lucide-react'
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import {
  batchCreateTasks,
  bulkDeleteTasks,
  bulkUpdateTasks,
  createTask,
  deleteTask,
  getNext7DaysTasks,
  getNoDateTasks,
  getOverdueTasks,
  getStarredTasks,
  getTasksWithSubtasks,
  moveInboxTaskToList,
  reorderTasks,
  updateTask,
} from '@/actions/tasks'
import { BatchAddTasksDialog } from '@/components/dashboard/batch-add-dialog'
import { SmartTaskInput } from '@/components/dashboard/smart-task-input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useRealtime } from '@/hooks/use-realtime'
import { useI18n } from '@/i18n'
import { TaskPanelSkeleton } from './skeletons'

// Local filter types for internal use (maps to shared types)
type StatusFilter = TaskFiltersValue['status']
type StarFilter = TaskFiltersValue['star']
type DateFilter = TaskFiltersValue['date']

interface TaskFilters {
  status: StatusFilter
  star: StarFilter
  date: DateFilter
}

interface GroupOption {
  id: string
  name: string
}

type SmartViewType = 'starred' | 'overdue' | 'next7days' | 'nodate'

interface TaskPanelProps {
  list: List | null
  selectedTaskId?: string | null
  allLists?: List[]
  allGroups?: GroupOption[]
  isInboxMode?: boolean
  smartView?: SmartViewType | null
  onTaskSelect?: (taskId: string | null) => void
}

export interface TaskPanelRef {
  triggerCreateTask: () => void
}

export function TaskPanel({ ref, list, selectedTaskId, allLists, allGroups, isInboxMode, smartView, onTaskSelect }: TaskPanelProps & { ref?: React.RefObject<TaskPanelRef | null> }) {
  const { t } = useI18n()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTasks, setIsLoadingTasks] = useState(true)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [addingSubtaskTo, setAddingSubtaskTo] = useState<string | null>(null)
  const [newSubtaskName, setNewSubtaskName] = useState('')
  const [taskContextById, setTaskContextById] = useState<Map<string, TaskContextMeta>>(new Map())
  const [filters, setFilters] = useState<TaskFilters>({
    status: 'all',
    star: 'all',
    date: 'all',
  })

  // Multi-select state
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())

  // Batch add dialog state
  const [isBatchAddOpen, setIsBatchAddOpen] = useState(false)

  const smartViewPollingInFlightRef = useRef(false)
  const isSmartViewMode = Boolean(smartView)
  const isDateDrivenSmartView = smartView === 'overdue' || smartView === 'next7days'
  const canCreateTasks = Boolean(list) && !isSmartViewMode

  const applySmartViewResults = useCallback((items: TaskSearchResult[]) => {
    setTasks(items as Task[])
    const context = new Map<string, TaskContextMeta>()
    items.forEach((task) => {
      context.set(task.id, {
        listName: task.list_name,
        listIcon: task.list_icon,
        groupName: task.group_name,
        groupColor: task.group_color,
      })
    })
    setTaskContextById(context)
  }, [])

  const loadSmartViewTasks = useCallback(async (view: SmartViewType): Promise<TaskSearchResult[]> => {
    if (view === 'starred')
      return getStarredTasks()
    if (view === 'overdue')
      return getOverdueTasks()
    if (view === 'next7days')
      return getNext7DaysTasks()
    return getNoDateTasks()
  }, [])

  const reloadTasks = useCallback(async () => {
    if (smartView) {
      const data = await loadSmartViewTasks(smartView)
      applySmartViewResults(data)
      return
    }

    if (list) {
      const data = await getTasksWithSubtasks(list.id)
      setTasks(data)
      setTaskContextById(new Map())
      return
    }

    setTasks([])
    setTaskContextById(new Map())
  }, [applySmartViewResults, list, loadSmartViewTasks, smartView])

  // Realtime subscription for tasks
  useRealtime({
    channel: smartView ? `smart-view-tasks-${smartView}` : `tasks-${list?.id || 'none'}`,
    table: 'tasks',
    onInsert: () => reloadTasks(),
    onUpdate: () => reloadTasks(),
    onDelete: () => reloadTasks(),
    enabled: !!list || isSmartViewMode,
  })

  // Keep smart-view labels fresh when lists/groups are renamed.
  useRealtime({
    channel: `smart-view-lists-${smartView || 'none'}`,
    table: 'lists',
    onInsert: () => reloadTasks(),
    onUpdate: () => reloadTasks(),
    onDelete: () => reloadTasks(),
    enabled: isSmartViewMode,
  })

  useRealtime({
    channel: `smart-view-groups-${smartView || 'none'}`,
    table: 'groups',
    onInsert: () => reloadTasks(),
    onUpdate: () => reloadTasks(),
    onDelete: () => reloadTasks(),
    enabled: isSmartViewMode,
  })

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    triggerCreateTask: () => {
      if (!canCreateTasks)
        return
      setIsAdding(true)
    },
  }), [canCreateTasks])

  useEffect(() => {
    async function loadTasks() {
      setIsLoadingTasks(true)
      setIsAdding(false)
      setAddingSubtaskTo(null)
      setNewSubtaskName('')
      await reloadTasks()
      setIsLoadingTasks(false)
    }
    loadTasks()
  }, [reloadTasks])

  // Date-based smart views need a local-midnight refresh even without DB changes.
  useEffect(() => {
    if (!isDateDrivenSmartView) {
      return
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const scheduleNextMidnightReload = () => {
      const now = new Date()
      const nextMidnight = new Date(now)
      nextMidnight.setHours(24, 0, 2, 0)
      const delay = Math.max(1000, nextMidnight.getTime() - now.getTime())

      timeoutId = setTimeout(async () => {
        await reloadTasks()
        scheduleNextMidnightReload()
      }, delay)
    }

    scheduleNextMidnightReload()

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [isDateDrivenSmartView, reloadTasks])

  // Fallback refresh for Smart Views when external edits are made from another session/device.
  // This keeps membership changes (e.g. Starred/No Date/Overdue) visible even if realtime events are delayed.
  useEffect(() => {
    if (!isSmartViewMode) {
      return
    }

    let intervalId: ReturnType<typeof setInterval> | null = null
    let disposed = false

    const safeReload = async () => {
      if (disposed || smartViewPollingInFlightRef.current) {
        return
      }

      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return
      }

      smartViewPollingInFlightRef.current = true
      try {
        await reloadTasks()
      }
      finally {
        smartViewPollingInFlightRef.current = false
      }
    }

    // Refresh quickly on focus/visibility changes.
    const handleFocus = () => {
      void safeReload()
    }
    const handleVisibilityChange = () => {
      void safeReload()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus)
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }

    // Periodic fallback for cross-session updates.
    intervalId = setInterval(() => {
      void safeReload()
    }, 3000)

    return () => {
      disposed = true
      if (intervalId) {
        clearInterval(intervalId)
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [isSmartViewMode, reloadTasks])

  const handleAddTask = async (parsed: {
    name: string
    due_date?: string | null
    plan_date?: string | null
    duration_minutes?: number | null
    starred?: boolean
    subtasks?: string[]
  }) => {
    if (!canCreateTasks || !list || !parsed.name.trim())
      return
    setIsLoading(true)
    const result = await createTask(list.id, parsed.name.trim(), undefined, {
      due_date: parsed.due_date,
      plan_date: parsed.plan_date,
      duration_minutes: parsed.duration_minutes,
      starred: parsed.starred,
    })

    if (result.success) {
      // Create subtasks if any
      if (parsed.subtasks && parsed.subtasks.length > 0) {
        // Get the newly created task to find its ID
        const updatedTasks = await getTasksWithSubtasks(list.id)
        const newTask = updatedTasks.find(t => t.name === parsed.name.trim())
        if (newTask) {
          for (const subtaskName of parsed.subtasks) {
            await createTask(list.id, subtaskName.trim(), newTask.id)
          }
        }
      }
      setIsAdding(false)
      await reloadTasks()
    }
    setIsLoading(false)
  }

  const handleBatchCreateTasks = async (tasks: ParsedTask[]) => {
    if (!canCreateTasks || !list || tasks.length === 0)
      return
    setIsLoading(true)
    const result = await batchCreateTasks(list.id, tasks)
    if (result.success) {
      await reloadTasks()
    }
    setIsLoading(false)
  }

  const handleAddSubtask = async (parentId: string) => {
    if (!canCreateTasks || !list || !newSubtaskName.trim())
      return
    setIsLoading(true)
    const result = await createTask(list.id, newSubtaskName.trim(), parentId)
    if (result.success) {
      setNewSubtaskName('')
      setAddingSubtaskTo(null)
      await reloadTasks()
      // Expand parent task to show new subtask
      setExpandedTasks(prev => new Set(prev).add(parentId))
    }
    setIsLoading(false)
  }

  const handleToggleComplete = async (task: Task) => {
    // Optimistic update - immediately update UI
    const newCompletedState = !task.completed

    // Update local state immediately
    const updateTaskInList = (tasks: Task[]): Task[] => {
      return tasks.map((t) => {
        if (t.id === task.id) {
          return { ...t, completed: newCompletedState }
        }
        if (t.subtasks) {
          return { ...t, subtasks: updateTaskInList(t.subtasks) }
        }
        return t
      })
    }

    setTasks(prev => updateTaskInList(prev))

    // Send request to server (don't await, let it happen in background)
    try {
      await updateTask(task.id, { completed: newCompletedState })
      // Reload to sync with server state (subtle, in background)
      reloadTasks()
    }
    catch (error) {
      // Revert on error
      setTasks(prev => updateTaskInList(prev))
      console.error('Failed to update task:', error)
    }
  }

  const handleToggleStar = async (task: Task) => {
    // Optimistic update - immediately update UI
    const newStarredState = !task.starred

    const updateTaskInList = (tasks: Task[]): Task[] => {
      return tasks.map((t) => {
        if (t.id === task.id) {
          return { ...t, starred: newStarredState }
        }
        if (t.subtasks) {
          return { ...t, subtasks: updateTaskInList(t.subtasks) }
        }
        return t
      })
    }

    setTasks(prev => updateTaskInList(prev))

    try {
      await updateTask(task.id, { starred: newStarredState })
      reloadTasks()
    }
    catch (error) {
      setTasks(prev => updateTaskInList(prev))
      console.error('Failed to update task star:', error)
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTaskId(task.id)
    setEditName(task.name)
  }

  const handleSaveEdit = async () => {
    if (!editingTaskId || !editName.trim())
      return
    await updateTask(editingTaskId, { name: editName.trim() })
    setEditingTaskId(null)
    setEditName('')
    await reloadTasks()
  }

  const handleCancelEdit = () => {
    setEditingTaskId(null)
    setEditName('')
  }

  const handleOpenDetail = (task: Task) => {
    onTaskSelect?.(task.id)
  }

  const openDeleteDialog = (task: Task) => {
    setDeleteTaskId(task.id)
    setIsDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTaskId)
      return
    setIsLoading(true)
    await deleteTask(deleteTaskId)
    setIsDeleteOpen(false)
    setDeleteTaskId(null)
    await reloadTasks()
    setIsLoading(false)
  }

  const handleToggleExpand = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      }
      else {
        next.add(taskId)
      }
      return next
    })
  }

  // Handle task reordering from TaskList component
  const handleReorder = async (listId: string, orderedIds: string[], parentId?: string) => {
    await reorderTasks(listId, orderedIds, parentId)
    await reloadTasks()
  }

  const handleSubtaskKeyDown = (e: React.KeyboardEvent, parentId: string) => {
    if (e.key === 'Enter') {
      handleAddSubtask(parentId)
    }
    else if (e.key === 'Escape') {
      setNewSubtaskName('')
      setAddingSubtaskTo(null)
    }
  }

  const countAllTasks = (taskList: Task[]): number => {
    return taskList.reduce((count, task) => {
      return count + 1 + (task.subtasks ? countAllTasks(task.subtasks) : 0)
    }, 0)
  }

  // Check if any filter is active
  const hasActiveFilters = filters.status !== 'all' || filters.star !== 'all' || filters.date !== 'all'

  // Filter tasks based on current filters
  const filterTasks = useCallback((taskList: Task[]): Task[] => {
    const today = getLocalDateString(new Date())

    const matchesFilter = (task: Task): boolean => {
      // Status filter
      if (filters.status === 'completed' && !task.completed)
        return false
      if (filters.status === 'incomplete' && task.completed)
        return false

      // Star filter
      if (filters.star === 'starred' && !task.starred)
        return false
      if (filters.star === 'unstarred' && task.starred)
        return false

      // Date filter
      if (filters.date === 'overdue') {
        if (!task.due_date || task.completed)
          return false
        if (task.due_date >= today)
          return false
      }
      if (filters.date === 'today') {
        if (!task.due_date)
          return false
        if (task.due_date !== today)
          return false
      }
      if (filters.date === 'upcoming') {
        if (!task.due_date || task.completed)
          return false
        if (task.due_date <= today)
          return false
      }
      if (filters.date === 'nodate' && task.due_date)
        return false

      return true
    }

    return taskList.filter(matchesFilter).map(task => ({
      ...task,
      subtasks: task.subtasks ? filterTasks(task.subtasks) : [],
    }))
  }, [filters])

  // Get filtered tasks
  const filteredTasks = hasActiveFilters ? filterTasks(tasks) : tasks
  const groupNameById = new Map((allGroups || []).map(group => [group.id, group.name]))
  const inboxMoveTargets: InboxMoveTarget[]
    = isInboxMode && list
      ? (allLists || [])
          .filter(candidate => candidate.id !== list.id)
          .map(candidate => ({
            listId: candidate.id,
            listName: candidate.name,
            listIcon: candidate.icon ?? undefined,
            groupName: groupNameById.get(candidate.group_id) || t('taskPanel.labels.unknownGroup'),
          }))
          .sort(
            (a, b) =>
              a.groupName.localeCompare(b.groupName)
              || a.listName.localeCompare(b.listName),
          )
      : []

  // Multi-select handlers
  const handleToggleSelectionMode = () => {
    setIsSelectionMode(prev => !prev)
    if (isSelectionMode) {
      setSelectedTaskIds(new Set())
    }
  }

  const handleToggleSelect = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      }
      else {
        next.add(taskId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    const allTopLevelTaskIds = filteredTasks.map(t => t.id)
    setSelectedTaskIds(new Set(allTopLevelTaskIds))
  }

  const handleDeselectAll = () => {
    setSelectedTaskIds(new Set())
  }

  const selectedCount = selectedTaskIds.size

  // Bulk operation handlers
  const handleBulkComplete = async (completed: boolean) => {
    const taskIds = Array.from(selectedTaskIds)
    setIsLoading(true)

    // Optimistic update
    const updateInList = (tasks: Task[]): Task[] => {
      return tasks.map((t) => {
        if (selectedTaskIds.has(t.id)) {
          return { ...t, completed }
        }
        if (t.subtasks) {
          return { ...t, subtasks: updateInList(t.subtasks) }
        }
        return t
      })
    }
    setTasks(prev => updateInList(prev))

    try {
      await bulkUpdateTasks(taskIds, { completed })
      await reloadTasks()
    }
    catch (error) {
      console.error('Failed to bulk update tasks:', error)
      await reloadTasks()
    }
    setIsLoading(false)
  }

  const handleBulkStar = async (starred: boolean) => {
    const taskIds = Array.from(selectedTaskIds)
    setIsLoading(true)

    // Optimistic update
    const updateInList = (tasks: Task[]): Task[] => {
      return tasks.map((t) => {
        if (selectedTaskIds.has(t.id)) {
          return { ...t, starred }
        }
        if (t.subtasks) {
          return { ...t, subtasks: updateInList(t.subtasks) }
        }
        return t
      })
    }
    setTasks(prev => updateInList(prev))

    try {
      await bulkUpdateTasks(taskIds, { starred })
      await reloadTasks()
    }
    catch (error) {
      console.error('Failed to bulk update tasks:', error)
      await reloadTasks()
    }
    setIsLoading(false)
  }

  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)

  const openBulkDeleteDialog = () => {
    setIsBulkDeleteOpen(true)
  }

  const handleBulkDelete = async () => {
    const taskIds = Array.from(selectedTaskIds)
    setIsLoading(true)
    setIsBulkDeleteOpen(false)

    // Optimistic update - remove deleted tasks from local state
    const removeFromList = (tasks: Task[]): Task[] => {
      return tasks.filter(t => !selectedTaskIds.has(t.id)).map((t) => {
        if (t.subtasks) {
          return { ...t, subtasks: removeFromList(t.subtasks) }
        }
        return t
      })
    }
    setTasks(prev => removeFromList(prev))
    setSelectedTaskIds(new Set())

    try {
      await bulkDeleteTasks(taskIds)
      await reloadTasks()
    }
    catch (error) {
      console.error('Failed to bulk delete tasks:', error)
      await reloadTasks()
    }
    setIsLoading(false)
  }

  const [isBulkDateDialogOpen, setIsBulkDateDialogOpen] = useState(false)
  const [bulkDateValue, setBulkDateValue] = useState<Date | undefined>(undefined)

  const handleBulkSetDate = async () => {
    const taskIds = Array.from(selectedTaskIds)
    const dateStr = bulkDateValue ? getLocalDateString(bulkDateValue) : null
    setIsLoading(true)
    setIsBulkDateDialogOpen(false)

    // Optimistic update
    const updateInList = (tasks: Task[]): Task[] => {
      return tasks.map((t) => {
        if (selectedTaskIds.has(t.id)) {
          return { ...t, due_date: dateStr }
        }
        if (t.subtasks) {
          return { ...t, subtasks: updateInList(t.subtasks) }
        }
        return t
      })
    }
    setTasks(prev => updateInList(prev))
    setSelectedTaskIds(new Set())

    try {
      await bulkUpdateTasks(taskIds, { due_date: dateStr })
      await reloadTasks()
    }
    catch (error) {
      console.error('Failed to bulk update tasks:', error)
      await reloadTasks()
    }
    setIsLoading(false)
    setBulkDateValue(undefined)
  }

  const startAddSubtask = (task: Task) => {
    setAddingSubtaskTo(task.id)
    setNewSubtaskName('')
    // Make sure parent is expanded
    if (!expandedTasks.has(task.id)) {
      setExpandedTasks(prev => new Set(prev).add(task.id))
    }
  }

  const handleMoveToList = async (task: Task, targetListId: string) => {
    setIsLoading(true)
    const result = await moveInboxTaskToList(task.id, targetListId)
    if (result.success) {
      if (selectedTaskId === task.id) {
        onTaskSelect?.(null)
      }
      await reloadTasks()
    }
    else {
      console.error('Failed to move inbox task:', result.error)
    }
    setIsLoading(false)
  }

  if (!list && !smartView) {
    return (
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-stone-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
          {t('taskPanel.emptyStates.selectList')}
        </h2>
        <p className="text-stone-500 dark:text-stone-400">
          {t('taskPanel.emptyStates.chooseListFromSidebar')}
        </p>
      </div>
    )
  }

  // Show skeleton while loading
  if (isLoadingTasks) {
    return <TaskPanelSkeleton />
  }

  const totalTasks = countAllTasks(tasks)
  const smartViewTitle = smartView
    ? smartView === 'starred'
      ? t('sidebar.starred')
      : smartView === 'overdue'
        ? t('sidebar.overdue')
        : smartView === 'next7days'
          ? t('sidebar.next7Days')
          : t('sidebar.noDate')
    : ''
  const panelTitle = smartView ? smartViewTitle : list?.name || t('taskPanel.tasks')
  const panelIcon = smartView
    ? smartView === 'starred'
      ? '⭐'
      : smartView === 'overdue'
        ? '⚠️'
        : smartView === 'next7days'
          ? '🗓️'
          : '◯'
    : list?.icon || '📋'
  const smartViewEmptyTitle = smartView
    ? smartView === 'starred'
      ? t('taskPanel.emptyStates.noStarredTasks')
      : smartView === 'overdue'
        ? t('taskPanel.emptyStates.noOverdueTasks')
        : smartView === 'next7days'
          ? t('taskPanel.emptyStates.noUpcomingTasks')
          : t('taskPanel.emptyStates.noNoDateTasks')
    : t('taskPanel.noTasks')
  const smartViewEmptyHint = smartView
    ? t('taskPanel.emptyStates.smartViewHint')
    : ''
  const displayedCount = hasActiveFilters ? countAllTasks(filteredTasks) : totalTasks

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{panelIcon}</span>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            {panelTitle}
          </h2>
          <span className="text-sm text-stone-500 dark:text-stone-400">
            {hasActiveFilters ? `${displayedCount} of ${totalTasks}` : totalTasks}
            {' '}
            {totalTasks === 1 ? t('taskPanel.labels.task') : t('taskPanel.labels.tasks')}
          </span>
          {smartView && (
            <span className="hidden md:inline text-xs text-stone-500 dark:text-stone-400 rounded-full bg-stone-100 dark:bg-stone-800 px-2 py-0.5">
              {t('taskPanel.labels.crossListView')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Selection Mode Toggle */}
          {!isSmartViewMode && (
            <Button
              variant={isSelectionMode ? 'default' : 'outline'}
              size="sm"
              onClick={handleToggleSelectionMode}
              className={isSelectionMode ? 'bg-blue-500 hover:bg-blue-600' : ''}
            >
              <CheckSquare className="h-4 w-4 mr-1" />
              {isSelectionMode ? `${selectedCount} ${t('taskPanel.selected')}` : t('taskPanel.select')}
            </Button>
          )}
          {/* Filter Dropdown */}
          <SharedTaskFilters
            value={filters}
            onChange={setFilters}
            labels={{
              status: t('filter.completed'), // Using "completed" section header as "Status"
              all: t('filter.all'),
              incomplete: t('filter.incomplete'),
              completed: t('filter.completed'),
              starred: t('filter.starred'),
              unstarred: t('filter.unstarred'),
              dueDate: t('taskDetail.dueDate'),
              overdue: t('filter.overdue'),
              today: t('filter.today'),
              upcoming: t('filter.upcoming'),
              noDueDate: t('filter.noDueDate'),
              clearFilters: t('taskPanel.clearFilters'),
              filter: t('taskPanel.labels.filter'),
            }}
          />

          {canCreateTasks && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBatchAddOpen(true)}
                disabled={isLoading}
              >
                <ListIcon className="h-4 w-4 mr-1" />
                {t('batchAdd.title')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdding(true)}
                disabled={isAdding}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('taskPanel.addTask')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {isSelectionMode && selectedCount > 0 && (
        <TaskBulkActions
          selectedCount={selectedCount}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onComplete={() => handleBulkComplete(true)}
          onIncomplete={() => handleBulkComplete(false)}
          onStar={() => handleBulkStar(true)}
          onUnstar={() => handleBulkStar(false)}
          onDelete={openBulkDeleteDialog}
          onSetDate={() => setIsBulkDateDialogOpen(true)}
          onCancel={handleToggleSelectionMode}
          labels={{
            tasksSelected: t('taskPanel.tasksSelected'),
            selectAll: t('taskPanel.selectAll'),
            deselect: t('taskPanel.deselect'),
            complete: t('taskPanel.complete'),
            incomplete: t('taskPanel.incomplete'),
            star: t('taskPanel.star'),
            unstar: t('taskPanel.unstar'),
            delete: t('taskPanel.delete'),
            setDate: t('taskPanel.setDate'),
            cancel: t('taskPanel.cancel'),
          }}
        />
      )}

      {/* Task List */}
      <div className="p-4">
        {/* Smart Task Input */}
        {canCreateTasks && isAdding && (
          <div className="mb-4">
            <SmartTaskInput
              onAddTask={handleAddTask}
              onCancel={() => setIsAdding(false)}
              isLoading={isLoading}
              placeholder={t('smartInput.placeholder')}
            />
          </div>
        )}

        {/* Add Subtask Input (appears after parent task) */}
        {canCreateTasks && addingSubtaskTo && (
          <div className="flex items-center gap-3 px-4 py-3 mb-2 ml-6 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
            <Circle className="h-5 w-5 text-stone-300" />
            <input
              type="text"
              value={newSubtaskName}
              onChange={e => setNewSubtaskName(e.target.value)}
              onKeyDown={e => handleSubtaskKeyDown(e, addingSubtaskTo)}
              placeholder={t('taskPanel.placeholders.subtaskName')}
              className="flex-1 bg-transparent outline-none text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
              autoFocus
              disabled={isLoading}
            />
            <Button
              size="sm"
              onClick={() => handleAddSubtask(addingSubtaskTo)}
              disabled={isLoading || !newSubtaskName.trim()}
            >
              {t('common.add')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setNewSubtaskName('')
                setAddingSubtaskTo(null)
              }}
            >
              {t('common.cancel')}
            </Button>
          </div>
        )}

        {/* Task Items */}
        {tasks.length === 0 && !isAdding
          ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-stone-400" />
                </div>
                <p className="text-stone-500 dark:text-stone-400 mb-4">
                  {smartView ? smartViewEmptyTitle : t('taskPanel.noTasks')}
                </p>
                {smartView
                  ? (
                      <p className="text-sm text-stone-400 dark:text-stone-500">
                        {smartViewEmptyHint}
                      </p>
                    )
                  : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAdding(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {t('taskPanel.createFirstTask')}
                      </Button>
                    )}
              </div>
            )
          : filteredTasks.length === 0 && !isAdding
            ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                    <Filter className="h-6 w-6 text-stone-400" />
                  </div>
                  <p className="text-stone-500 dark:text-stone-400 mb-4">
                    {t('taskPanel.noTasksMatchFilters')}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({ status: 'all', star: 'all', date: 'all' })}
                  >
                    {t('taskPanel.clearFilters')}
                  </Button>
                </div>
              )
            : (
                <TaskList
                  tasks={filteredTasks}
                  expandedTasks={expandedTasks}
                  onToggleExpand={handleToggleExpand}
                  onToggleComplete={handleToggleComplete}
                  onToggleStar={handleToggleStar}
                  onEdit={handleEdit}
                  onDelete={openDeleteDialog}
                  onAddSubtask={startAddSubtask}
                  onOpenDetail={handleOpenDetail}
                  onOpenUrl={(task) => {
                    if (task.url) {
                      window.open(task.url, '_blank', 'noopener,noreferrer')
                    }
                  }}
                  editingTaskId={editingTaskId}
                  editName={editName}
                  onEditNameChange={setEditName}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  canMoveFromInbox={isInboxMode}
                  moveTargets={inboxMoveTargets}
                  onMoveToList={handleMoveToList}
                  disableSorting={isSmartViewMode}
                  allowSubtaskActions={!isSmartViewMode}
                  contextMeta={taskContextById}
                  onReorder={handleReorder}
                  listId={list?.id || ''}
                  isSelectionMode={isSelectionMode}
                  selectedTaskIds={selectedTaskIds}
                  onToggleSelect={handleToggleSelect}
                  labels={{
                    edit: t('common.edit'),
                    addSubtask: t('taskPanel.addSubtask'),
                    moveTo: t('common.move'),
                    delete: t('common.delete'),
                    openUrl: t('taskDetail.openUrl'),
                  }}
                />
              )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('taskPanel.dialogs.deleteTask')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {t('taskPanel.dialogs.deleteTaskDesc')}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isLoading}
            >
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('taskPanel.dialogs.deleteTasks').replace('{count}', String(selectedCount))}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {t('taskPanel.dialogs.deleteTasksDesc').replace('{count}', String(selectedCount))}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDeleteOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isLoading}
            >
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Set Date Dialog */}
      <Dialog open={isBulkDateDialogOpen} onOpenChange={setIsBulkDateDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('taskPanel.dialogs.setDueDateForTasks').replace('{count}', String(selectedCount))}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Calendar
              mode="single"
              selected={bulkDateValue}
              onSelect={setBulkDateValue}
              className="rounded-md border"
            />
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBulkDateValue(undefined)
                }}
              >
                {t('taskPanel.dialogs.clearDate')}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDateDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleBulkSetDate}
              disabled={isLoading}
            >
              {t('taskPanel.dialogs.setDate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Add Tasks Dialog */}
      <BatchAddTasksDialog
        open={isBatchAddOpen}
        onOpenChange={setIsBatchAddOpen}
        onCreateTasks={handleBatchCreateTasks}
        isLoading={isLoading}
      />
    </div>
  )
}
