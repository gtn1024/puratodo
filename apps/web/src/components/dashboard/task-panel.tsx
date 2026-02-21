"use client";

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useRef } from "react";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getTasksWithSubtasks,
  createTask,
  updateTask,
  deleteTask,
  getNext7DaysTasks,
  getNoDateTasks,
  getOverdueTasks,
  getStarredTasks,
  moveInboxTaskToList,
  reorderTasks,
  bulkUpdateTasks,
  bulkDeleteTasks,
  type Task,
  type TaskSearchResult,
} from "@/actions/tasks";
import {
  MoreHorizontal,
  Plus,
  Circle,
  CheckCircle,
  Star,
  GripVertical,
  ChevronRight,
  ChevronDown,
  Filter,
  CheckSquare,
  Square,
  Trash2,
  Star as StarIcon,
  X,
} from "lucide-react";
import { TaskPanelSkeleton } from "./skeletons";
import type { List } from "@/actions/lists";
import { useRealtime } from "@/hooks/use-realtime";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  pointerWithin,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  TaskFilters as SharedTaskFilters,
  TaskBulkActions,
  type TaskFiltersValue,
} from "@puratodo/task-ui";

// Local filter types for internal use (maps to shared types)
type StatusFilter = TaskFiltersValue["status"];
type StarFilter = TaskFiltersValue["star"];
type DateFilter = TaskFiltersValue["date"];

interface TaskFilters {
  status: StatusFilter;
  star: StarFilter;
  date: DateFilter;
}

type GroupOption = {
  id: string;
  name: string;
};

type SmartViewType = "starred" | "overdue" | "next7days" | "nodate";

type TaskContextMeta = {
  listName: string;
  listIcon: string;
  groupName: string;
  groupColor: string;
};

function toLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

interface InboxMoveTarget {
  listId: string;
  listName: string;
  listIcon: string | null;
  groupName: string;
}

interface TaskItemProps {
  task: Task;
  level: number;
  expandedTasks: Set<string>;
  onToggleExpand: (taskId: string) => void;
  onToggleComplete: (task: Task) => void;
  onToggleStar: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onAddSubtask: (task: Task) => void;
  onOpenDetail: (task: Task) => void;
  editingTaskId: string | null;
  editName: string;
  onEditNameChange: (name: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  canMoveFromInbox?: boolean;
  moveTargets?: InboxMoveTarget[];
  onMoveToList?: (task: Task, targetListId: string) => void;
  disableSorting?: boolean;
  allowSubtaskActions?: boolean;
  contextMeta?: TaskContextMeta;
  renderSubtasks: (task: Task, level: number) => React.ReactNode;
  // Multi-select props
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (taskId: string) => void;
}

function TaskItem({
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
}: TaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: disableSorting });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isEditing = editingTaskId === task.id;
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const isExpanded = expandedTasks.has(task.id);
  const showInboxMoveMenu =
    Boolean(canMoveFromInbox && level === 0 && onMoveToList) &&
    (moveTargets?.length || 0) > 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSaveEdit();
    } else if (e.key === "Escape") {
      onCancelEdit();
    }
  };

  const paddingLeft = level * 24;

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
            hasSubtasks ? "opacity-100" : "opacity-0"
          }`}
        >
          {hasSubtasks &&
            (isExpanded ? (
              <ChevronDown className="h-4 w-4 text-stone-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-stone-500" />
            ))}
        </button>

        {/* Drag Handle */}
        {disableSorting ? (
          <span
            style={{ marginLeft: paddingLeft }}
            className="w-4 h-4"
            aria-hidden
          />
        ) : (
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
            {isSelected ? (
              <CheckSquare className="h-4 w-4 text-blue-500" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>
        )}

        {/* Checkbox */}
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggleComplete(task)}
          className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
        />

        {/* Task Name or Edit Input */}
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none border-b border-stone-300 dark:border-stone-600 text-stone-900 dark:text-stone-100"
            autoFocus
          />
        ) : (
          <span
            onClick={() => onOpenDetail(task)}
            className={`flex-1 cursor-pointer hover:underline ${
              task.completed
                ? "text-stone-400 dark:text-stone-500 line-through"
                : "text-stone-900 dark:text-stone-100"
            }`}
          >
            {task.name}
          </span>
        )}

        {contextMeta && level === 0 && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
            <span>{contextMeta.listIcon || "📋"}</span>
            <span className="max-w-[10rem] truncate">{contextMeta.listName}</span>
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: contextMeta.groupColor || "#6b7280" }}
            />
            <span className="max-w-[7rem] truncate">{contextMeta.groupName}</span>
          </span>
        )}

        {/* Star Button */}
        <button
          onClick={() => onToggleStar(task)}
          className={`opacity-0 group-hover:opacity-100 transition-opacity ${
            task.starred
              ? "opacity-100 text-yellow-500"
              : "text-stone-400 hover:text-yellow-500"
          }`}
        >
          <Star
            className={`h-4 w-4 ${task.starred ? "fill-yellow-500" : ""}`}
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
              Edit
            </DropdownMenuItem>
            {allowSubtaskActions !== false && (
              <DropdownMenuItem onClick={() => onAddSubtask(task)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Subtask
              </DropdownMenuItem>
            )}
            {showInboxMoveMenu && (
              <>
                <DropdownMenuItem disabled className="text-xs text-stone-500">
                  Move to...
                </DropdownMenuItem>
                {moveTargets?.map((target) => (
                  <DropdownMenuItem
                    key={target.listId}
                    onClick={() => onMoveToList?.(task, target.listId)}
                    className="flex items-center gap-2"
                  >
                    <span>{target.listIcon || "📋"}</span>
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
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </li>

      {/* Subtasks */}
      {isExpanded && hasSubtasks && renderSubtasks(task, level)}
    </>
  );
}

interface TaskPanelProps {
  list: List | null;
  selectedTaskId?: string | null;
  allLists?: List[];
  allGroups?: GroupOption[];
  isInboxMode?: boolean;
  smartView?: SmartViewType | null;
  onTaskSelect?: (taskId: string | null) => void;
}

export interface TaskPanelRef {
  triggerCreateTask: () => void;
}

const ROOT_SORTABLE_ID = "root-tasks";
const SUBTASK_SORTABLE_PREFIX = "subtasks-";

function getParentIdFromContainerId(containerId: string): string | null {
  if (containerId === ROOT_SORTABLE_ID) {
    return null;
  }

  if (containerId.startsWith(SUBTASK_SORTABLE_PREFIX)) {
    return containerId.slice(SUBTASK_SORTABLE_PREFIX.length) || null;
  }

  return null;
}

function reorderSiblingTasks(
  taskList: Task[],
  parentId: string | null,
  activeId: string,
  overId: string
): { nextTasks: Task[]; orderedIds: string[] } {
  if (parentId === null) {
    const oldIndex = taskList.findIndex((task) => task.id === activeId);
    const newIndex = taskList.findIndex((task) => task.id === overId);

    if (oldIndex === -1 || newIndex === -1) {
      return { nextTasks: taskList, orderedIds: [] };
    }

    const nextTasks = arrayMove(taskList, oldIndex, newIndex);
    return { nextTasks, orderedIds: nextTasks.map((task) => task.id) };
  }

  const reorderInNestedTasks = (
    tasks: Task[]
  ): { nextTasks: Task[]; orderedIds: string[]; changed: boolean } => {
    let orderedIds: string[] = [];
    let changed = false;

    const nextTasks = tasks.map((task) => {
      if (task.id === parentId) {
        const subtasks = task.subtasks || [];
        const oldIndex = subtasks.findIndex((subtask) => subtask.id === activeId);
        const newIndex = subtasks.findIndex((subtask) => subtask.id === overId);

        if (oldIndex === -1 || newIndex === -1) {
          return task;
        }

        const reorderedSubtasks = arrayMove(subtasks, oldIndex, newIndex);
        orderedIds = reorderedSubtasks.map((subtask) => subtask.id);
        changed = true;
        return { ...task, subtasks: reorderedSubtasks };
      }

      if (task.subtasks && task.subtasks.length > 0) {
        const nested = reorderInNestedTasks(task.subtasks);
        if (nested.changed) {
          orderedIds = nested.orderedIds;
          changed = true;
          return { ...task, subtasks: nested.nextTasks };
        }
      }

      return task;
    });

    return { nextTasks, orderedIds, changed };
  };

  const reordered = reorderInNestedTasks(taskList);
  return {
    nextTasks: reordered.changed ? reordered.nextTasks : taskList,
    orderedIds: reordered.orderedIds,
  };
}

export const TaskPanel = forwardRef<TaskPanelRef, TaskPanelProps>(
  function TaskPanel(
    { list, selectedTaskId, allLists, allGroups, isInboxMode, smartView, onTaskSelect },
    ref
  ) {
  const { t } = useI18n();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskName, setNewTaskName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [addingSubtaskTo, setAddingSubtaskTo] = useState<string | null>(null);
  const [newSubtaskName, setNewSubtaskName] = useState("");
  const [taskContextById, setTaskContextById] = useState<Map<string, TaskContextMeta>>(new Map());
  const [filters, setFilters] = useState<TaskFilters>({
    status: "all",
    star: "all",
    date: "all",
  });

  // Multi-select state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  const newTaskInputRef = useRef<HTMLInputElement>(null);
  const smartViewPollingInFlightRef = useRef(false);
  const isSmartViewMode = Boolean(smartView);
  const isDateDrivenSmartView = smartView === "overdue" || smartView === "next7days";
  const canCreateTasks = Boolean(list) && !isSmartViewMode;

  const applySmartViewResults = useCallback((items: TaskSearchResult[]) => {
    setTasks(items as Task[]);
    const context = new Map<string, TaskContextMeta>();
    items.forEach((task) => {
      context.set(task.id, {
        listName: task.list_name,
        listIcon: task.list_icon,
        groupName: task.group_name,
        groupColor: task.group_color,
      });
    });
    setTaskContextById(context);
  }, []);

  const loadSmartViewTasks = useCallback(async (view: SmartViewType): Promise<TaskSearchResult[]> => {
    if (view === "starred") return getStarredTasks();
    if (view === "overdue") return getOverdueTasks();
    if (view === "next7days") return getNext7DaysTasks();
    return getNoDateTasks();
  }, []);

  const reloadTasks = useCallback(async () => {
    if (smartView) {
      const data = await loadSmartViewTasks(smartView);
      applySmartViewResults(data);
      return;
    }

    if (list) {
      const data = await getTasksWithSubtasks(list.id);
      setTasks(data);
      setTaskContextById(new Map());
      return;
    }

    setTasks([]);
    setTaskContextById(new Map());
  }, [applySmartViewResults, list, loadSmartViewTasks, smartView]);

  // Realtime subscription for tasks
  useRealtime({
    channel: smartView ? `smart-view-tasks-${smartView}` : `tasks-${list?.id || "none"}`,
    table: "tasks",
    onInsert: () => reloadTasks(),
    onUpdate: () => reloadTasks(),
    onDelete: () => reloadTasks(),
    enabled: !!list || isSmartViewMode,
  });

  // Keep smart-view labels fresh when lists/groups are renamed.
  useRealtime({
    channel: `smart-view-lists-${smartView || "none"}`,
    table: "lists",
    onInsert: () => reloadTasks(),
    onUpdate: () => reloadTasks(),
    onDelete: () => reloadTasks(),
    enabled: isSmartViewMode,
  });

  useRealtime({
    channel: `smart-view-groups-${smartView || "none"}`,
    table: "groups",
    onInsert: () => reloadTasks(),
    onUpdate: () => reloadTasks(),
    onDelete: () => reloadTasks(),
    enabled: isSmartViewMode,
  });

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    triggerCreateTask: () => {
      if (!canCreateTasks) return;
      setIsAdding(true);
      // Focus the input after a brief delay to ensure it's rendered
      setTimeout(() => {
        newTaskInputRef.current?.focus();
      }, 50);
    },
  }), [canCreateTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    async function loadTasks() {
      setIsLoadingTasks(true);
      setIsAdding(false);
      setAddingSubtaskTo(null);
      setNewTaskName("");
      setNewSubtaskName("");
      await reloadTasks();
      setIsLoadingTasks(false);
    }
    loadTasks();
  }, [reloadTasks]);

  // Date-based smart views need a local-midnight refresh even without DB changes.
  useEffect(() => {
    if (!isDateDrivenSmartView) {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const scheduleNextMidnightReload = () => {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 2, 0);
      const delay = Math.max(1000, nextMidnight.getTime() - now.getTime());

      timeoutId = setTimeout(async () => {
        await reloadTasks();
        scheduleNextMidnightReload();
      }, delay);
    };

    scheduleNextMidnightReload();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isDateDrivenSmartView, reloadTasks]);

  // Fallback refresh for Smart Views when external edits are made from another session/device.
  // This keeps membership changes (e.g. Starred/No Date/Overdue) visible even if realtime events are delayed.
  useEffect(() => {
    if (!isSmartViewMode) {
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let disposed = false;

    const safeReload = async () => {
      if (disposed || smartViewPollingInFlightRef.current) {
        return;
      }

      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }

      smartViewPollingInFlightRef.current = true;
      try {
        await reloadTasks();
      } finally {
        smartViewPollingInFlightRef.current = false;
      }
    };

    // Refresh quickly on focus/visibility changes.
    const handleFocus = () => {
      void safeReload();
    };
    const handleVisibilityChange = () => {
      void safeReload();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleFocus);
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    // Periodic fallback for cross-session updates.
    intervalId = setInterval(() => {
      void safeReload();
    }, 3000);

    return () => {
      disposed = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleFocus);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [isSmartViewMode, reloadTasks]);

  const handleAddTask = async () => {
    if (!canCreateTasks || !list || !newTaskName.trim()) return;
    setIsLoading(true);
    const result = await createTask(list.id, newTaskName.trim());
    if (result.success) {
      setNewTaskName("");
      setIsAdding(false);
      await reloadTasks();
    }
    setIsLoading(false);
  };

  const handleAddSubtask = async (parentId: string) => {
    if (!canCreateTasks || !list || !newSubtaskName.trim()) return;
    setIsLoading(true);
    const result = await createTask(list.id, newSubtaskName.trim(), parentId);
    if (result.success) {
      setNewSubtaskName("");
      setAddingSubtaskTo(null);
      await reloadTasks();
      // Expand parent task to show new subtask
      setExpandedTasks((prev) => new Set(prev).add(parentId));
    }
    setIsLoading(false);
  };

  const handleToggleComplete = async (task: Task) => {
    // Optimistic update - immediately update UI
    const newCompletedState = !task.completed;

    // Update local state immediately
    const updateTaskInList = (tasks: Task[]): Task[] => {
      return tasks.map(t => {
        if (t.id === task.id) {
          return { ...t, completed: newCompletedState };
        }
        if (t.subtasks) {
          return { ...t, subtasks: updateTaskInList(t.subtasks) };
        }
        return t;
      });
    };

    setTasks(prev => updateTaskInList(prev));

    // Send request to server (don't await, let it happen in background)
    try {
      await updateTask(task.id, { completed: newCompletedState });
      // Reload to sync with server state (subtle, in background)
      reloadTasks();
    } catch (error) {
      // Revert on error
      setTasks(prev => updateTaskInList(prev));
      console.error('Failed to update task:', error);
    }
  };

  const handleToggleStar = async (task: Task) => {
    // Optimistic update - immediately update UI
    const newStarredState = !task.starred;

    const updateTaskInList = (tasks: Task[]): Task[] => {
      return tasks.map(t => {
        if (t.id === task.id) {
          return { ...t, starred: newStarredState };
        }
        if (t.subtasks) {
          return { ...t, subtasks: updateTaskInList(t.subtasks) };
        }
        return t;
      });
    };

    setTasks(prev => updateTaskInList(prev));

    try {
      await updateTask(task.id, { starred: newStarredState });
      reloadTasks();
    } catch (error) {
      setTasks(prev => updateTaskInList(prev));
      console.error('Failed to update task star:', error);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditName(task.name);
  };

  const handleSaveEdit = async () => {
    if (!editingTaskId || !editName.trim()) return;
    await updateTask(editingTaskId, { name: editName.trim() });
    setEditingTaskId(null);
    setEditName("");
    await reloadTasks();
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditName("");
  };

  const handleOpenDetail = (task: Task) => {
    onTaskSelect?.(task.id);
  };

  const openDeleteDialog = (task: Task) => {
    setDeleteTaskId(task.id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTaskId) return;
    setIsLoading(true);
    await deleteTask(deleteTaskId);
    setIsDeleteOpen(false);
    setDeleteTaskId(null);
    await reloadTasks();
    setIsLoading(false);
  };

  const handleToggleExpand = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !list) return;

    const activeContainerId = String(active.data.current?.sortable.containerId || "");
    const overContainerId = String(over.data.current?.sortable.containerId || "");

    if (
      !activeContainerId ||
      !overContainerId ||
      activeContainerId !== overContainerId
    ) {
      return;
    }

    if (
      activeContainerId !== ROOT_SORTABLE_ID &&
      !activeContainerId.startsWith(SUBTASK_SORTABLE_PREFIX)
    ) {
      return;
    }

    const parentId = getParentIdFromContainerId(activeContainerId);
    const activeId = String(active.id);
    const overId = String(over.id);

    const { nextTasks, orderedIds } = reorderSiblingTasks(
      tasks,
      parentId,
      activeId,
      overId
    );

    if (orderedIds.length === 0) {
      return;
    }

    setTasks(nextTasks);
    await reorderTasks(list.id, orderedIds, parentId ?? undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTask();
    } else if (e.key === "Escape") {
      setNewTaskName("");
      setIsAdding(false);
    }
  };

  const handleSubtaskKeyDown = (e: React.KeyboardEvent, parentId: string) => {
    if (e.key === "Enter") {
      handleAddSubtask(parentId);
    } else if (e.key === "Escape") {
      setNewSubtaskName("");
      setAddingSubtaskTo(null);
    }
  };

  const countAllTasks = (taskList: Task[]): number => {
    return taskList.reduce((count, task) => {
      return count + 1 + (task.subtasks ? countAllTasks(task.subtasks) : 0);
    }, 0);
  };

  // Check if any filter is active
  const hasActiveFilters = filters.status !== "all" || filters.star !== "all" || filters.date !== "all";

  // Filter tasks based on current filters
  const filterTasks = useCallback((taskList: Task[]): Task[] => {
    const today = toLocalDateString(new Date());

    const matchesFilter = (task: Task): boolean => {
      // Status filter
      if (filters.status === "completed" && !task.completed) return false;
      if (filters.status === "incomplete" && task.completed) return false;

      // Star filter
      if (filters.star === "starred" && !task.starred) return false;
      if (filters.star === "unstarred" && task.starred) return false;

      // Date filter
      if (filters.date === "overdue") {
        if (!task.due_date || task.completed) return false;
        if (task.due_date >= today) return false;
      }
      if (filters.date === "today") {
        if (!task.due_date) return false;
        if (task.due_date !== today) return false;
      }
      if (filters.date === "upcoming") {
        if (!task.due_date || task.completed) return false;
        if (task.due_date <= today) return false;
      }
      if (filters.date === "nodate" && task.due_date) return false;

      return true;
    };

    return taskList.filter(matchesFilter).map(task => ({
      ...task,
      subtasks: task.subtasks ? filterTasks(task.subtasks) : []
    }));
  }, [filters]);

  // Get filtered tasks
  const filteredTasks = hasActiveFilters ? filterTasks(tasks) : tasks;
  const groupNameById = new Map((allGroups || []).map((group) => [group.id, group.name]));
  const inboxMoveTargets: InboxMoveTarget[] =
    isInboxMode && list
      ? (allLists || [])
          .filter((candidate) => candidate.id !== list.id)
          .map((candidate) => ({
            listId: candidate.id,
            listName: candidate.name,
            listIcon: candidate.icon,
            groupName: groupNameById.get(candidate.group_id) || "Unknown Group",
          }))
          .sort(
            (a, b) =>
              a.groupName.localeCompare(b.groupName) ||
              a.listName.localeCompare(b.listName)
          )
      : [];

  // Multi-select handlers
  const handleToggleSelectionMode = () => {
    setIsSelectionMode((prev) => !prev);
    if (isSelectionMode) {
      setSelectedTaskIds(new Set());
    }
  };

  const handleToggleSelect = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const allTopLevelTaskIds = filteredTasks.map((t) => t.id);
    setSelectedTaskIds(new Set(allTopLevelTaskIds));
  };

  const handleDeselectAll = () => {
    setSelectedTaskIds(new Set());
  };

  const selectedCount = selectedTaskIds.size;

  // Bulk operation handlers
  const handleBulkComplete = async (completed: boolean) => {
    const taskIds = Array.from(selectedTaskIds);
    setIsLoading(true);

    // Optimistic update
    const updateInList = (tasks: Task[]): Task[] => {
      return tasks.map(t => {
        if (selectedTaskIds.has(t.id)) {
          return { ...t, completed };
        }
        if (t.subtasks) {
          return { ...t, subtasks: updateInList(t.subtasks) };
        }
        return t;
      });
    };
    setTasks(prev => updateInList(prev));

    try {
      await bulkUpdateTasks(taskIds, { completed });
      await reloadTasks();
    } catch (error) {
      console.error('Failed to bulk update tasks:', error);
      await reloadTasks();
    }
    setIsLoading(false);
  };

  const handleBulkStar = async (starred: boolean) => {
    const taskIds = Array.from(selectedTaskIds);
    setIsLoading(true);

    // Optimistic update
    const updateInList = (tasks: Task[]): Task[] => {
      return tasks.map(t => {
        if (selectedTaskIds.has(t.id)) {
          return { ...t, starred };
        }
        if (t.subtasks) {
          return { ...t, subtasks: updateInList(t.subtasks) };
        }
        return t;
      });
    };
    setTasks(prev => updateInList(prev));

    try {
      await bulkUpdateTasks(taskIds, { starred });
      await reloadTasks();
    } catch (error) {
      console.error('Failed to bulk update tasks:', error);
      await reloadTasks();
    }
    setIsLoading(false);
  };

  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  const openBulkDeleteDialog = () => {
    setIsBulkDeleteOpen(true);
  };

  const handleBulkDelete = async () => {
    const taskIds = Array.from(selectedTaskIds);
    setIsLoading(true);
    setIsBulkDeleteOpen(false);

    // Optimistic update - remove deleted tasks from local state
    const removeFromList = (tasks: Task[]): Task[] => {
      return tasks.filter(t => !selectedTaskIds.has(t.id)).map(t => {
        if (t.subtasks) {
          return { ...t, subtasks: removeFromList(t.subtasks) };
        }
        return t;
      });
    };
    setTasks(prev => removeFromList(prev));
    setSelectedTaskIds(new Set());

    try {
      await bulkDeleteTasks(taskIds);
      await reloadTasks();
    } catch (error) {
      console.error('Failed to bulk delete tasks:', error);
      await reloadTasks();
    }
    setIsLoading(false);
  };

  const [isBulkDateDialogOpen, setIsBulkDateDialogOpen] = useState(false);
  const [bulkDateValue, setBulkDateValue] = useState<Date | undefined>(undefined);

  const handleBulkSetDate = async () => {
    const taskIds = Array.from(selectedTaskIds);
    const dateStr = bulkDateValue ? toLocalDateString(bulkDateValue) : null;
    setIsLoading(true);
    setIsBulkDateDialogOpen(false);

    // Optimistic update
    const updateInList = (tasks: Task[]): Task[] => {
      return tasks.map(t => {
        if (selectedTaskIds.has(t.id)) {
          return { ...t, due_date: dateStr };
        }
        if (t.subtasks) {
          return { ...t, subtasks: updateInList(t.subtasks) };
        }
        return t;
      });
    };
    setTasks(prev => updateInList(prev));
    setSelectedTaskIds(new Set());

    try {
      await bulkUpdateTasks(taskIds, { due_date: dateStr });
      await reloadTasks();
    } catch (error) {
      console.error('Failed to bulk update tasks:', error);
      await reloadTasks();
    }
    setIsLoading(false);
    setBulkDateValue(undefined);
  };

  const startAddSubtask = (task: Task) => {
    setAddingSubtaskTo(task.id);
    setNewSubtaskName("");
    // Make sure parent is expanded
    if (!expandedTasks.has(task.id)) {
      setExpandedTasks((prev) => new Set(prev).add(task.id));
    }
  };

  const handleMoveToList = async (task: Task, targetListId: string) => {
    setIsLoading(true);
    const result = await moveInboxTaskToList(task.id, targetListId);
    if (result.success) {
      if (selectedTaskId === task.id) {
        onTaskSelect?.(null);
      }
      await reloadTasks();
    } else {
      console.error("Failed to move inbox task:", result.error);
    }
    setIsLoading(false);
  };

  const renderSubtasks = useCallback(
    (task: Task, level: number): React.ReactNode => {
      if (!task.subtasks || task.subtasks.length === 0) return null;

      return (
        <SortableContext
          id={`${SUBTASK_SORTABLE_PREFIX}${task.id}`}
          items={task.subtasks.map((subtask) => subtask.id)}
          strategy={verticalListSortingStrategy}
        >
          {task.subtasks.map((subtask) => (
            <TaskItem
              key={subtask.id}
              task={subtask}
              level={level + 1}
              expandedTasks={expandedTasks}
              onToggleExpand={handleToggleExpand}
              onToggleComplete={handleToggleComplete}
              onToggleStar={handleToggleStar}
              onEdit={handleEdit}
              onDelete={openDeleteDialog}
              onAddSubtask={startAddSubtask}
              onOpenDetail={handleOpenDetail}
              editingTaskId={editingTaskId}
              editName={editName}
              onEditNameChange={setEditName}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              canMoveFromInbox={false}
              moveTargets={inboxMoveTargets}
              onMoveToList={handleMoveToList}
              disableSorting={isSmartViewMode}
              isSelectionMode={isSelectionMode}
              isSelected={selectedTaskIds.has(subtask.id)}
              onToggleSelect={handleToggleSelect}
              allowSubtaskActions={!isSmartViewMode}
              renderSubtasks={renderSubtasks}
            />
          ))}
        </SortableContext>
      );
    },
    [
      expandedTasks,
      editingTaskId,
      editName,
      handleToggleExpand,
      handleToggleComplete,
      handleToggleStar,
      handleEdit,
      openDeleteDialog,
      handleOpenDetail,
      handleSaveEdit,
      handleCancelEdit,
      isSmartViewMode,
    ]
  );

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
          Select a List
        </h2>
        <p className="text-stone-500 dark:text-stone-400">
          Choose a list from the sidebar to view its tasks
        </p>
      </div>
    );
  }

  // Show skeleton while loading
  if (isLoadingTasks) {
    return <TaskPanelSkeleton />;
  }

  const totalTasks = countAllTasks(tasks);
  const smartViewTitle = smartView
    ? smartView === "starred"
      ? t("sidebar.starred")
      : smartView === "overdue"
        ? t("sidebar.overdue")
        : smartView === "next7days"
          ? t("sidebar.next7Days")
          : t("sidebar.noDate")
    : "";
  const panelTitle = smartView ? smartViewTitle : list?.name || t("taskPanel.tasks");
  const panelIcon = smartView
    ? smartView === "starred"
      ? "⭐"
      : smartView === "overdue"
        ? "⚠️"
        : smartView === "next7days"
          ? "🗓️"
          : "◯"
    : list?.icon || "📋";
  const smartViewEmptyTitle = smartView
    ? smartView === "starred"
      ? "No starred tasks"
      : smartView === "overdue"
        ? "No overdue tasks"
        : smartView === "next7days"
          ? "No tasks in the next 7 days"
          : "No no-date tasks"
    : t("taskPanel.noTasks");
  const smartViewEmptyHint = smartView
    ? "Tasks from all lists will appear here when they match this view."
    : "";
  const displayedCount = hasActiveFilters ? countAllTasks(filteredTasks) : totalTasks;

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
            {hasActiveFilters ? `${displayedCount} of ${totalTasks}` : totalTasks} {totalTasks === 1 ? "task" : "tasks"}
          </span>
          {smartView && (
            <span className="hidden md:inline text-xs text-stone-500 dark:text-stone-400 rounded-full bg-stone-100 dark:bg-stone-800 px-2 py-0.5">
              Cross-list view
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Selection Mode Toggle */}
          {!isSmartViewMode && (
            <Button
              variant={isSelectionMode ? "default" : "outline"}
              size="sm"
              onClick={handleToggleSelectionMode}
              className={isSelectionMode ? "bg-blue-500 hover:bg-blue-600" : ""}
            >
              <CheckSquare className="h-4 w-4 mr-1" />
              {isSelectionMode ? `${selectedCount} ${t("taskPanel.selected")}` : t("taskPanel.select")}
            </Button>
          )}
          {/* Filter Dropdown */}
          <SharedTaskFilters
            value={filters}
            onChange={setFilters}
            labels={{
              all: t("filter.all"),
              incomplete: t("filter.incomplete"),
              completed: t("filter.completed"),
              starred: t("filter.starred"),
              unstarred: t("filter.unstarred"),
              dueDate: t("taskDetail.dueDate"),
              overdue: t("filter.overdue"),
              today: t("filter.today"),
              upcoming: t("filter.upcoming"),
              noDueDate: t("filter.noDueDate"),
              clearFilters: t("taskPanel.clearFilters"),
              filter: "Filter",
            }}
          />

          {canCreateTasks && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(true)}
              disabled={isAdding}
            >
              <Plus className="h-4 w-4 mr-1" />
              {t("taskPanel.addTask")}
            </Button>
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
            tasksSelected: t("taskPanel.tasksSelected"),
            selectAll: t("taskPanel.selectAll"),
            deselect: "Deselect",
            complete: t("taskPanel.complete"),
            incomplete: t("taskPanel.incomplete"),
            star: t("taskPanel.star"),
            unstar: t("taskPanel.unstar"),
            delete: t("taskPanel.delete"),
            setDate: t("taskPanel.setDate"),
            cancel: t("taskPanel.cancel"),
          }}
        />
      )}

      {/* Task List */}
      <div className="p-4">
        {/* Add Task Input */}
        {canCreateTasks && isAdding && (
          <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
            <Circle className="h-5 w-5 text-stone-300" />
            <input
              ref={newTaskInputRef}
              type="text"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Task name..."
              className="flex-1 bg-transparent outline-none text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
              autoFocus
              disabled={isLoading}
            />
            <Button
              size="sm"
              onClick={handleAddTask}
              disabled={isLoading || !newTaskName.trim()}
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setNewTaskName("");
                setIsAdding(false);
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Add Subtask Input (appears after parent task) */}
        {canCreateTasks && addingSubtaskTo && (
          <div className="flex items-center gap-3 px-4 py-3 mb-2 ml-6 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
            <Circle className="h-5 w-5 text-stone-300" />
            <input
              type="text"
              value={newSubtaskName}
              onChange={(e) => setNewSubtaskName(e.target.value)}
              onKeyDown={(e) => handleSubtaskKeyDown(e, addingSubtaskTo)}
              placeholder="Subtask name..."
              className="flex-1 bg-transparent outline-none text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
              autoFocus
              disabled={isLoading}
            />
            <Button
              size="sm"
              onClick={() => handleAddSubtask(addingSubtaskTo)}
              disabled={isLoading || !newSubtaskName.trim()}
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setNewSubtaskName("");
                setAddingSubtaskTo(null);
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Task Items */}
        {tasks.length === 0 && !isAdding ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-stone-400" />
            </div>
            <p className="text-stone-500 dark:text-stone-400 mb-4">
              {smartView ? smartViewEmptyTitle : t("taskPanel.noTasks")}
            </p>
            {smartView ? (
              <p className="text-sm text-stone-400 dark:text-stone-500">
                {smartViewEmptyHint}
              </p>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdding(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t("taskPanel.createFirstTask")}
              </Button>
            )}
          </div>
        ) : filteredTasks.length === 0 && !isAdding ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
              <Filter className="h-6 w-6 text-stone-400" />
            </div>
            <p className="text-stone-500 dark:text-stone-400 mb-4">
              {t("taskPanel.noTasksMatchFilters")}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({ status: "all", star: "all", date: "all" })}
            >
              {t("taskPanel.clearFilters")}
            </Button>
          </div>
        ) : (
          isSmartViewMode ? (
            <ul className="space-y-1">
              {filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  level={0}
                  expandedTasks={expandedTasks}
                  onToggleExpand={handleToggleExpand}
                  onToggleComplete={handleToggleComplete}
                  onToggleStar={handleToggleStar}
                  onEdit={handleEdit}
                  onDelete={openDeleteDialog}
                  onAddSubtask={startAddSubtask}
                  onOpenDetail={handleOpenDetail}
                  editingTaskId={editingTaskId}
                  editName={editName}
                  onEditNameChange={setEditName}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  canMoveFromInbox={false}
                  moveTargets={[]}
                  onMoveToList={undefined}
                  disableSorting
                  allowSubtaskActions={false}
                  contextMeta={taskContextById.get(task.id)}
                  renderSubtasks={renderSubtasks}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedTaskIds.has(task.id)}
                  onToggleSelect={handleToggleSelect}
                />
              ))}
            </ul>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={({ droppableContainers, ...args }) => {
                // First try pointer within, then fall back to closest center
                const pointerCollisions = pointerWithin({
                  droppableContainers,
                  ...args,
                });
                if (pointerCollisions.length > 0) {
                  return pointerCollisions;
                }
                return closestCenter({
                  droppableContainers,
                  ...args,
                });
              }}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                id={ROOT_SORTABLE_ID}
                items={filteredTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-1">
                  {filteredTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      level={0}
                      expandedTasks={expandedTasks}
                      onToggleExpand={handleToggleExpand}
                      onToggleComplete={handleToggleComplete}
                      onToggleStar={handleToggleStar}
                      onEdit={handleEdit}
                      onDelete={openDeleteDialog}
                      onAddSubtask={startAddSubtask}
                      onOpenDetail={handleOpenDetail}
                      editingTaskId={editingTaskId}
                      editName={editName}
                      onEditNameChange={setEditName}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={handleCancelEdit}
                      canMoveFromInbox={isInboxMode}
                      moveTargets={inboxMoveTargets}
                      onMoveToList={handleMoveToList}
                      disableSorting={false}
                      allowSubtaskActions
                      contextMeta={undefined}
                      renderSubtasks={renderSubtasks}
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedTaskIds.has(task.id)}
                      onToggleSelect={handleToggleSelect}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Are you sure you want to delete this task? Any subtasks will also be
            deleted. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isLoading}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {selectedCount} Tasks</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Are you sure you want to delete {selectedCount} {selectedCount === 1 ? "task" : "tasks"}?
            Any subtasks will also be deleted. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isLoading}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Set Date Dialog */}
      <Dialog open={isBulkDateDialogOpen} onOpenChange={setIsBulkDateDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Set Due Date for {selectedCount} Tasks</DialogTitle>
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
                  setBulkDateValue(undefined);
                }}
              >
                Clear date
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkSetDate}
              disabled={isLoading}
            >
              Set Date
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});
