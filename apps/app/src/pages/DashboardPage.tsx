import * as React from "react";
import {
  LogOut,
  CheckCircle2,
  Plus,
  Folder,
  List,
  Star,
  ChevronDown,
  ChevronRight,
  X,
  Check,
  Pencil,
  Trash2,
  Users,
  Move,
  Calendar,
  Search,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AccountSettingsDialog } from "@/components/AccountSettingsDialog";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/stores/authStore";
import { useDataStore } from "@/stores/dataStore";
import type { List as ListType } from "@/lib/api/lists";
import type { Group } from "@/lib/api/groups";
import type { Task } from "@/lib/api/tasks";

// Color options for groups
const GROUP_COLORS = [
  { name: "Violet", value: "#8b5cf6" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Orange", value: "#f97316" },
  { name: "Red", value: "#ef4444" },
  { name: "Pink", value: "#ec4899" },
  { name: "Cyan", value: "#06b6d4" },
];

export function DashboardPage() {
  const { logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, activeAccountId } = useAuthStore();
  const {
    groups,
    lists,
    tasks,
    isLoading,
    error,
    fetchAll,
    fetchTasks,
    createGroup,
    updateGroup,
    reorderGroups,
    deleteGroup,
    createList,
    updateList,
    moveList,
    reorderLists,
    deleteList,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    reorderTasks,
    clear,
  } = useDataStore();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = React.useState(false);
  const [selectedListId, setSelectedListId] = React.useState<string | null>(null);
  const [currentView, setCurrentView] = React.useState<'today' | 'starred' | 'list'>('today');
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = React.useState<Set<string>>(new Set());
  const [showNewGroupInput, setShowNewGroupInput] = React.useState(false);
  const [newGroupName, setNewGroupName] = React.useState("");
  const [newGroupColor, setNewGroupColor] = React.useState(GROUP_COLORS[0].value);
  const [isCreatingGroup, setIsCreatingGroup] = React.useState(false);

  // Edit group state
  const [editingGroup, setEditingGroup] = React.useState<Group | null>(null);
  const [editGroupName, setEditGroupName] = React.useState("");
  const [editGroupColor, setEditGroupColor] = React.useState("");
  const [isUpdatingGroup, setIsUpdatingGroup] = React.useState(false);
  const [draggingGroupId, setDraggingGroupId] = React.useState<string | null>(null);
  const [dropTargetGroupId, setDropTargetGroupId] = React.useState<string | null>(null);

  // Create list state
  const [showNewListInput, setShowNewListInput] = React.useState<string | null>(null); // group_id
  const [newListName, setNewListName] = React.useState("");
  const [isCreatingList, setIsCreatingList] = React.useState(false);

  // Edit list state
  const [editingList, setEditingList] = React.useState<ListType | null>(null);
  const [editListName, setEditListName] = React.useState("");
  const [isUpdatingList, setIsUpdatingList] = React.useState(false);

  // Move list state
  const [movingList, setMovingList] = React.useState<ListType | null>(null);
  const [targetGroupId, setTargetGroupId] = React.useState<string>("");
  const [isMovingList, setIsMovingList] = React.useState(false);

  // List drag-and-drop state
  const [draggingListId, setDraggingListId] = React.useState<string | null>(null);
  const [dropTargetListId, setDropTargetListId] = React.useState<string | null>(null);

  // Task drag-and-drop state
  const [draggingTaskId, setDraggingTaskId] = React.useState<string | null>(null);
  const [dropTargetTaskId, setDropTargetTaskId] = React.useState<string | null>(null);
  const [dropTargetListForTask, setDropTargetListForTask] = React.useState<string | null>(null);
  // For subtask drag-and-drop
  const [draggingSubtaskParentId, setDraggingSubtaskParentId] = React.useState<string | null>(null);

  // Create task state
  const [showNewTaskInput, setShowNewTaskInput] = React.useState(false);
  const [newTaskName, setNewTaskName] = React.useState("");
  const [isCreatingTask, setIsCreatingTask] = React.useState(false);

  // Edit task state
  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null);
  const [editingTaskName, setEditingTaskName] = React.useState("");

  // Context menu state for tasks
  const [taskContextMenu, setTaskContextMenu] = React.useState<{
    x: number;
    y: number;
    taskId: string;
    taskName: string;
  } | null>(null);

  // Task detail panel state
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [showAddSubtask, setShowAddSubtask] = React.useState(false);
  const [newSubtaskName, setNewSubtaskName] = React.useState("");

  // Search state
  const [showSearch, setShowSearch] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Context menu state for groups
  const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
    group: Group;
  } | null>(null);

  // Context menu state for lists
  const [listContextMenu, setListContextMenu] = React.useState<{
    x: number;
    y: number;
    list: ListType;
  } | null>(null);

  // Refetch data when active account changes
  React.useEffect(() => {
    if (!activeAccountId) return;
    clear();
    setSelectedListId(null);
    void fetchAll();
  }, [activeAccountId, clear, fetchAll]);

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // Toggle task expansion (for subtasks)
  const toggleTaskExpand = (taskId: string) => {
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

  // Get subtasks for a task
  const getSubtasks = (parentId: string): Task[] => {
    return tasks.filter((task) => task.parent_id === parentId);
  };

  // Get root tasks (no parent)
  const getRootTasks = (listId: string): Task[] => {
    return tasks
      .filter((task) => task.list_id === listId && !task.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order);
  };

  // Handle reordering subtasks within a parent task
  const handleReorderSubtasks = async (fromTaskId: string, toTaskId: string, parentId: string) => {
    if (fromTaskId === toTaskId) return;

    // Get subtasks with the same parent
    const siblingSubtasks = tasks.filter((task) => task.parent_id === parentId);
    const fromIndex = siblingSubtasks.findIndex((task) => task.id === fromTaskId);
    const toIndex = siblingSubtasks.findIndex((task) => task.id === toTaskId);
    if (fromIndex < 0 || toIndex < 0) return;

    // Reorder within siblings
    const nextSubtasks = [...siblingSubtasks];
    const [movedTask] = nextSubtasks.splice(fromIndex, 1);
    nextSubtasks.splice(toIndex, 0, movedTask);

    try {
      await reorderTasks(nextSubtasks.map((task) => task.id));
    } catch (err) {
      console.error("Failed to reorder subtasks:", err);
    }
  };

  // Recursively render task with subtasks
  const renderTaskItem = (task: Task, depth: number, parentId?: string): React.ReactNode => {
    const subtasks = getSubtasks(task.id);
    const hasSubtasks = subtasks.length > 0;
    const isExpanded = expandedTasks.has(task.id);
    const indentPadding = depth * 24; // 24px per level

    // Check if any subtasks are incomplete (for parent task indicator)
    const hasIncompleteSubtasks = hasSubtasks && subtasks.some((st) => !st.completed);
    const allSubtasksCompleted = hasSubtasks && subtasks.every((st) => st.completed);

    // All tasks (root and subtasks) can be dragged for reordering
    const isDraggable = true;
    const isSubtask = depth > 0;

    return (
      <div key={task.id}>
        <div
          draggable={isDraggable}
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", task.id);
            e.dataTransfer.setData("application/task-id", task.id);
            e.dataTransfer.setData("application/list-id", task.list_id);
            e.dataTransfer.setData("application/depth", String(depth));
            if (parentId) {
              e.dataTransfer.setData("application/parent-id", parentId);
            }
            setDraggingTaskId(task.id);
            if (isSubtask && parentId) {
              setDraggingSubtaskParentId(parentId);
            } else {
              setDraggingSubtaskParentId(null);
            }
          }}
          onDragEnd={() => {
            setDraggingTaskId(null);
            setDropTargetTaskId(null);
            setDropTargetListForTask(null);
            setDraggingSubtaskParentId(null);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            // Read from dataTransfer directly for synchronous access
            const sourceDepth = parseInt(e.dataTransfer.getData("application/depth") || "0", 10);
            const sourceParentId = e.dataTransfer.getData("application/parent-id");
            const sourceListId = e.dataTransfer.getData("application/list-id");

            if (draggingTaskId && draggingTaskId !== task.id) {
              // For subtasks: only allow drop if same parent
              if (sourceDepth > 0 && sourceParentId) {
                // Dragging a subtask - only allow drop on siblings
                if (isSubtask && parentId === sourceParentId) {
                  e.dataTransfer.dropEffect = "move";
                  setDropTargetTaskId(task.id);
                }
              } else {
                // Dragging a root task - only allow drop on root tasks in same list
                if (!isSubtask && task.list_id === sourceListId) {
                  e.dataTransfer.dropEffect = "move";
                  setDropTargetTaskId(task.id);
                }
              }
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            const sourceTaskId = e.dataTransfer.getData("text/plain") || draggingTaskId;
            const sourceDepth = parseInt(e.dataTransfer.getData("application/depth") || "0", 10);
            const sourceParentId = e.dataTransfer.getData("application/parent-id");

            if (isSubtask && sourceParentId && parentId === sourceParentId) {
              // Reordering subtasks within same parent
              void handleReorderSubtasks(sourceTaskId, task.id, parentId);
            } else if (!isSubtask && sourceDepth === 0) {
              // Reordering root tasks within same list
              const sourceListId = e.dataTransfer.getData("application/list-id");
              if (sourceListId === task.list_id) {
                void handleReorderTasks(sourceTaskId, task.id, task.list_id);
              }
            }
            setDraggingTaskId(null);
            setDropTargetTaskId(null);
            setDraggingSubtaskParentId(null);
          }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 ${
            draggingTaskId === task.id ? "opacity-60" : ""
          } ${
            dropTargetTaskId === task.id && draggingTaskId !== task.id
              ? "ring-2 ring-violet-300 dark:ring-violet-700"
              : ""
          }`}
          style={{ marginLeft: indentPadding }}
          onContextMenu={(e) => {
            e.preventDefault();
            setTaskContextMenu({
              x: e.clientX,
              y: e.clientY,
              taskId: task.id,
              taskName: task.name,
            });
          }}
        >
          {/* Expand/collapse button for tasks with subtasks */}
          {hasSubtasks ? (
            <button
              onClick={() => toggleTaskExpand(task.id)}
              className="p-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-5" /> // Spacer
          )}
          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer hover:border-green-500 ${
              task.completed
                ? "border-green-500 bg-green-500 text-white"
                : hasIncompleteSubtasks
                ? "border-violet-400 bg-violet-100 dark:bg-violet-900"
                : "border-zinc-300 dark:border-zinc-600"
            }`}
            onClick={() => toggleTaskComplete(task.id, task.completed)}
          >
            {task.completed ? (
              <Check className="w-3 h-3" />
            ) : hasIncompleteSubtasks ? (
              <div className="w-2 h-2 rounded-full bg-violet-500" />
            ) : null}
          </div>
          {editingTaskId === task.id ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={editingTaskName}
                onChange={(e) => setEditingTaskName(e.target.value)}
                className="flex-1 bg-transparent border border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 text-sm text-zinc-800 dark:text-zinc-100 outline-none focus:border-violet-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEditTask();
                  if (e.key === "Escape") cancelEditTask();
                }}
                onBlur={saveEditTask}
              />
              <button
                onClick={saveEditTask}
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                <Check className="w-4 h-4 text-green-500" />
              </button>
              <button
                onClick={cancelEditTask}
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
          ) : (
            <>
              <span
                className={`flex-1 text-sm cursor-pointer hover:text-violet-600 ${
                  task.completed
                    ? "line-through text-zinc-400 dark:text-zinc-500"
                    : "text-zinc-800 dark:text-zinc-100"
                }`}
                onClick={() => startEditTask(task.id, task.name)}
              >
                {task.name}
              </span>
              <button
                onClick={() => toggleTaskStar(task.id, task.starred)}
                className={`p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 ${
                  task.starred ? "text-yellow-500" : "text-zinc-300 dark:text-zinc-600"
                }`}
              >
                <Star className="w-4 h-4" fill={task.starred ? "currentColor" : "none"} />
              </button>
              <button
                onClick={() => setSelectedTask(task)}
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400"
                title="Task details"
              >
                <Calendar className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        {/* Render subtasks recursively */}
        {hasSubtasks && isExpanded && (
          <div className="space-y-2 mt-1">
            {subtasks
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((subtask) => renderTaskItem(subtask, depth + 1, task.id))}
          </div>
        )}
      </div>
    );
  };

  // Get lists for a group
  const getListsForGroup = (groupId: string): ListType[] => {
    return lists.filter((list) => list.group_id === groupId);
  };

  // Handle creating new group
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    setIsCreatingGroup(true);
    try {
      await createGroup({
        name: newGroupName.trim(),
        color: newGroupColor,
      });
      setNewGroupName("");
      setNewGroupColor(GROUP_COLORS[0].value);
      setShowNewGroupInput(false);
    } catch (err) {
      console.error("Failed to create group:", err);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  // Handle deleting a group
  const handleDeleteGroup = async (groupId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setContextMenu(null);
    if (!confirm("Delete this group and all its lists?")) return;

    try {
      await deleteGroup(groupId);
    } catch (err) {
      console.error("Failed to delete group:", err);
    }
  };

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent, group: Group) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, group });
  };

  // Open edit dialog
  const openEditDialog = (group: Group) => {
    setContextMenu(null);
    setEditingGroup(group);
    setEditGroupName(group.name);
    setEditGroupColor(group.color || GROUP_COLORS[0].value);
  };

  // Handle update group
  const handleUpdateGroup = async () => {
    if (!editingGroup || !editGroupName.trim()) return;

    setIsUpdatingGroup(true);
    try {
      await updateGroup(editingGroup.id, {
        name: editGroupName.trim(),
        color: editGroupColor,
      });
      setEditingGroup(null);
    } catch (err) {
      console.error("Failed to update group:", err);
    } finally {
      setIsUpdatingGroup(false);
    }
  };

  const handleReorderGroups = async (fromGroupId: string, toGroupId: string) => {
    if (fromGroupId === toGroupId) return;

    const fromIndex = groups.findIndex((group) => group.id === fromGroupId);
    const toIndex = groups.findIndex((group) => group.id === toGroupId);
    if (fromIndex < 0 || toIndex < 0) return;

    const nextGroups = [...groups];
    const [movedGroup] = nextGroups.splice(fromIndex, 1);
    nextGroups.splice(toIndex, 0, movedGroup);

    try {
      await reorderGroups(nextGroups.map((group) => group.id));
    } catch (err) {
      console.error("Failed to reorder groups:", err);
    }
  };

  // Handle reordering lists within a group
  const handleReorderLists = async (fromListId: string, toListId: string, groupId: string) => {
    if (fromListId === toListId) return;

    // Get lists within the same group
    const groupLists = lists.filter((list) => list.group_id === groupId);
    const fromIndex = groupLists.findIndex((list) => list.id === fromListId);
    const toIndex = groupLists.findIndex((list) => list.id === toListId);
    if (fromIndex < 0 || toIndex < 0) return;

    // Reorder within the group
    const nextLists = [...groupLists];
    const [movedList] = nextLists.splice(fromIndex, 1);
    nextLists.splice(toIndex, 0, movedList);

    try {
      await reorderLists(nextLists.map((list) => list.id));
    } catch (err) {
      console.error("Failed to reorder lists:", err);
    }
  };

  // Handle reordering tasks within a list
  const handleReorderTasks = async (fromTaskId: string, toTaskId: string, listId: string) => {
    if (fromTaskId === toTaskId) return;

    // Get root tasks (no parent) for the list
    const listTasks = tasks.filter((task) => task.list_id === listId && !task.parent_id);
    const fromIndex = listTasks.findIndex((task) => task.id === fromTaskId);
    const toIndex = listTasks.findIndex((task) => task.id === toTaskId);
    if (fromIndex < 0 || toIndex < 0) return;

    // Reorder within the list
    const nextTasks = [...listTasks];
    const [movedTask] = nextTasks.splice(fromIndex, 1);
    nextTasks.splice(toIndex, 0, movedTask);

    try {
      await reorderTasks(nextTasks.map((task) => task.id));
    } catch (err) {
      console.error("Failed to reorder tasks:", err);
    }
  };

  // Handle moving a task to a different list
  const handleMoveTask = async (taskId: string, targetListId: string) => {
    try {
      await moveTask(taskId, targetListId);
    } catch (err) {
      console.error("Failed to move task:", err);
    }
  };

  // Handle creating new list
  const handleCreateList = async (groupId: string) => {
    if (!newListName.trim()) return;

    setIsCreatingList(true);
    try {
      await createList({
        group_id: groupId,
        name: newListName.trim(),
      });
      setNewListName("");
      setShowNewListInput(null);
    } catch (err) {
      console.error("Failed to create list:", err);
    } finally {
      setIsCreatingList(false);
    }
  };

  // Handle list context menu
  const handleListContextMenu = (e: React.MouseEvent, list: ListType) => {
    e.preventDefault();
    e.stopPropagation();
    setListContextMenu({ x: e.clientX, y: e.clientY, list });
  };

  // Open edit list dialog
  const openEditListDialog = (list: ListType) => {
    setListContextMenu(null);
    setEditingList(list);
    setEditListName(list.name);
  };

  // Handle update list
  const handleUpdateList = async () => {
    if (!editingList || !editListName.trim()) return;

    setIsUpdatingList(true);
    try {
      await updateList(editingList.id, {
        name: editListName.trim(),
      });
      setEditingList(null);
    } catch (err) {
      console.error("Failed to update list:", err);
    } finally {
      setIsUpdatingList(false);
    }
  };

  // Handle deleting a list
  const handleDeleteList = async (listId: string) => {
    setListContextMenu(null);
    if (!confirm("Delete this list and all its tasks?")) return;

    try {
      await deleteList(listId);
      if (selectedListId === listId) {
        setSelectedListId(null);
      }
    } catch (err) {
      console.error("Failed to delete list:", err);
    }
  };

  // Create new task
  const handleCreateTask = async () => {
    if (!selectedListId || !newTaskName.trim()) return;

    setIsCreatingTask(true);
    try {
      await createTask({
        list_id: selectedListId,
        name: newTaskName.trim(),
      });
      setNewTaskName("");
      setShowNewTaskInput(false);
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Start editing a task
  const startEditTask = (taskId: string, taskName: string) => {
    setEditingTaskId(taskId);
    setEditingTaskName(taskName);
  };

  // Save edited task
  const saveEditTask = async () => {
    if (!editingTaskId || !editingTaskName.trim()) {
      setEditingTaskId(null);
      setEditingTaskName("");
      return;
    }

    try {
      await updateTask(editingTaskId, { name: editingTaskName.trim() });
    } catch (err) {
      console.error("Failed to update task:", err);
    } finally {
      setEditingTaskId(null);
      setEditingTaskName("");
    }
  };

  // Cancel editing a task
  const cancelEditTask = () => {
    setEditingTaskId(null);
    setEditingTaskName("");
  };

  // Handle delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      await deleteTask(taskId);
      setTaskContextMenu(null);
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  // Toggle task completion
  const toggleTaskComplete = async (taskId: string, currentCompleted: boolean) => {
    try {
      await updateTask(taskId, { completed: !currentCompleted });
    } catch (err) {
      console.error("Failed to toggle task completion:", err);
    }
  };

  // Toggle task star
  const toggleTaskStar = async (taskId: string, currentStarred: boolean) => {
    try {
      await updateTask(taskId, { starred: !currentStarred });
    } catch (err) {
      console.error("Failed to toggle task star:", err);
    }
  };

  // Update task due date
  const updateTaskDueDate = async (taskId: string, dueDate: string | null) => {
    try {
      await updateTask(taskId, { due_date: dueDate });
      // Update local selectedTask state if it matches
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, due_date: dueDate });
      }
    } catch (err) {
      console.error("Failed to update task due date:", err);
    }
  };

  // Update task planned date
  const updateTaskPlanDate = async (taskId: string, planDate: string | null) => {
    try {
      await updateTask(taskId, { plan_date: planDate });
      // Update local selectedTask state if it matches
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, plan_date: planDate });
      }
    } catch (err) {
      console.error("Failed to update task planned date:", err);
    }
  };

  // Update task comment
  const updateTaskComment = async (taskId: string, comment: string) => {
    try {
      await updateTask(taskId, { comment });
      // Update local selectedTask state if it matches
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, comment });
      }
    } catch (err) {
      console.error("Failed to update task comment:", err);
    }
  };

  // Update task duration
  const updateTaskDuration = async (taskId: string, duration: number | null) => {
    try {
      await updateTask(taskId, { duration_minutes: duration });
      // Update local selectedTask state if it matches
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, duration_minutes: duration });
      }
    } catch (err) {
      console.error("Failed to update task duration:", err);
    }
  };

  // Create subtask
  const handleCreateSubtask = async () => {
    if (!selectedTask || !newSubtaskName.trim()) return;
    try {
      await createTask({
        list_id: selectedTask.list_id,
        name: newSubtaskName.trim(),
        parent_id: selectedTask.id,
      });
      setNewSubtaskName("");
      setShowAddSubtask(false);
      // Refresh tasks to show the new subtask
      await fetchTasks();
    } catch (err) {
      console.error("Failed to create subtask:", err);
    }
  };

  // Open move list dialog
  const openMoveListDialog = (list: ListType) => {
    setListContextMenu(null);
    setMovingList(list);
    setTargetGroupId(list.group_id);
  };

  // Handle move list to different group
  const handleMoveList = async () => {
    if (!movingList || !targetGroupId || targetGroupId === movingList.group_id) {
      setMovingList(null);
      return;
    }

    setIsMovingList(true);
    try {
      await moveList(movingList.id, targetGroupId);
      setMovingList(null);
    } catch (err) {
      console.error("Failed to move list:", err);
    } finally {
      setIsMovingList(false);
    }
  };

  // Close context menu on click outside
  React.useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
      setListContextMenu(null);
      setTaskContextMenu(null);
    };
    if (contextMenu || listContextMenu || taskContextMenu) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [contextMenu, listContextMenu, taskContextMenu]);

  // Keyboard shortcut for search (Ctrl+K / Cmd+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch all tasks when search dialog opens
  React.useEffect(() => {
    if (showSearch && tasks.length === 0) {
      void fetchTasks();
    }
  }, [showSearch, tasks.length, fetchTasks]);

  // Search tasks across all lists
  const searchTasks = (query: string): Task[] => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return tasks.filter((task) =>
      task.name.toLowerCase().includes(lowerQuery)
    );
  };

  // Handle logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  const handleAccountChanged = async () => {
    clear();
    setSelectedListId(null);
    await fetchAll();
  };

  // Get selected list
  const selectedList = selectedListId ? lists.find((l) => l.id === selectedListId) : null;
  const selectedListTasks = selectedList ? getRootTasks(selectedList.id) : [];

  // Get today's tasks (due_date or plan_date = today)
  const getTodayTasks = (): Task[] => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return tasks.filter((task) =>
      !task.parent_id && (task.due_date === today || task.plan_date === today)
    ).sort((a, b) => a.sort_order - b.sort_order);
  };

  // Get starred tasks
  const getStarredTasks = (): Task[] => {
    return tasks.filter((task) =>
      !task.parent_id && task.starred
    ).sort((a, b) => a.sort_order - b.sort_order);
  };

  // Get display tasks based on current view
  const getDisplayTasks = (): Task[] => {
    if (currentView === 'today') {
      return getTodayTasks();
    } else if (currentView === 'starred') {
      return getStarredTasks();
    } else if (selectedListId) {
      return getRootTasks(selectedListId);
    }
    return [];
  };

  // Get header title based on current view
  const getHeaderTitle = (): string => {
    if (currentView === 'today') {
      return 'Today';
    } else if (currentView === 'starred') {
      return 'Starred';
    } else if (selectedList) {
      return selectedList.name;
    }
    return 'Today';
  };

  // Fetch tasks when view changes
  React.useEffect(() => {
    if (currentView === 'list' && !selectedListId) return;

    let isCancelled = false;
    setIsLoadingTasks(true);

    void fetchTasks()
      .catch((err) => {
        console.error("Failed to fetch tasks:", err);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingTasks(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [currentView, selectedListId, fetchTasks]);

  React.useEffect(() => {
    if (!selectedListId) return;

    let isCancelled = false;
    setIsLoadingTasks(true);

    void fetchTasks()
      .catch((err) => {
        console.error("Failed to fetch tasks:", err);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingTasks(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedListId, fetchTasks]);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-50 dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-zinc-900 dark:text-white">PuraToDo</span>
          </div>
        </div>

        {/* Quick Add */}
        <div className="p-4">
          <button
            onClick={() => {
              if (!selectedListId) {
                alert("Please select a list first");
                return;
              }
              setShowNewTaskInput(true);
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium hover:from-violet-500 hover:to-indigo-500 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 overflow-y-auto">
          <div className="space-y-1">
            <button
              onClick={() => {
                setCurrentView('today');
                setSelectedListId(null);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                currentView === 'today'
                  ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Today</span>
            </button>
            <button
              onClick={() => {
                setCurrentView('starred');
                setSelectedListId(null);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                currentView === 'starred'
                  ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              <Star className="w-5 h-5" />
              <span>Starred</span>
            </button>
          </div>

          {/* Groups section */}
          <div className="mt-6">
            <div className="flex items-center justify-between px-3 mb-2">
              <h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Groups
              </h3>
              <button
                onClick={() => setShowNewGroupInput(true)}
                className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* New group input */}
            {showNewGroupInput && (
              <div className="px-3 py-2 mb-2 bg-white dark:bg-zinc-700 rounded-lg border border-zinc-200 dark:border-zinc-600">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Group name"
                  className="w-full px-2 py-1 text-sm bg-transparent border-none outline-none text-zinc-900 dark:text-white placeholder-zinc-400"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateGroup();
                    if (e.key === "Escape") {
                      setShowNewGroupInput(false);
                      setNewGroupName("");
                    }
                  }}
                />
                <div className="flex items-center gap-1 mt-2">
                  {GROUP_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNewGroupColor(color.value)}
                      className={`w-5 h-5 rounded-full transition-transform ${
                        newGroupColor === color.value ? "ring-2 ring-offset-1 scale-110" : ""
                      }`}
                      style={{ backgroundColor: color.value }}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-end gap-2 mt-2">
                  <button
                    onClick={() => {
                      setShowNewGroupInput(false);
                      setNewGroupName("");
                    }}
                    className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-600 text-zinc-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCreateGroup}
                    disabled={isCreatingGroup || !newGroupName.trim()}
                    className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-600 text-green-500 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Loading state */}
            {isLoading && groups.length === 0 && (
              <div className="px-3 py-4 text-sm text-zinc-400 dark:text-zinc-500">Loading...</div>
            )}

            {/* Error state */}
            {error && (
              <div className="px-3 py-4 text-sm text-red-500 dark:text-red-400">{error}</div>
            )}

            {/* Groups list */}
            <div className="space-y-1">
              {groups.map((group) => {
                const groupLists = getListsForGroup(group.id);
                const isExpanded = expandedGroups.has(group.id);

                return (
                  <div
                    key={group.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (draggingGroupId && draggingGroupId !== group.id) {
                        e.dataTransfer.dropEffect = "move";
                        setDropTargetGroupId(group.id);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const sourceGroupId = e.dataTransfer.getData("text/plain") || draggingGroupId;
                      if (sourceGroupId) {
                        void handleReorderGroups(sourceGroupId, group.id);
                      }
                      setDraggingGroupId(null);
                      setDropTargetGroupId(null);
                    }}
                  >
                    <button
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", group.id);
                        setDraggingGroupId(group.id);
                      }}
                      onDragEnd={() => {
                        setDraggingGroupId(null);
                        setDropTargetGroupId(null);
                      }}
                      onClick={() => toggleGroup(group.id)}
                      onContextMenu={(e) => handleContextMenu(e, group)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors group ${
                        draggingGroupId === group.id ? "opacity-60" : ""
                      } ${
                        dropTargetGroupId === group.id && draggingGroupId !== group.id
                          ? "ring-2 ring-violet-300 dark:ring-violet-700"
                          : ""
                      }`}
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                      />
                      <Folder className="w-5 h-5" style={{ color: group.color ?? undefined }} />
                      <span className="flex-1 text-left truncate">{group.name}</span>
                      <button
                        onClick={(e) => handleDeleteGroup(group.id, e)}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-400 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </button>

                    {/* Lists under group */}
                    {isExpanded && (
                      <div className="ml-6 mt-1 space-y-1">
                        {groupLists.map((list) => (
                          <button
                            key={list.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.effectAllowed = "move";
                              e.dataTransfer.setData("text/plain", list.id);
                              e.dataTransfer.setData("application/group-id", group.id);
                              setDraggingListId(list.id);
                            }}
                            onDragEnd={() => {
                              setDraggingListId(null);
                              setDropTargetListId(null);
                              setDropTargetListForTask(null);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              // Handle list reordering
                              if (draggingListId && draggingListId !== list.id) {
                                e.dataTransfer.dropEffect = "move";
                                setDropTargetListId(list.id);
                              }
                              // Handle task drop to move to different list
                              if (draggingTaskId) {
                                e.dataTransfer.dropEffect = "move";
                                setDropTargetListForTask(list.id);
                              }
                            }}
                            onDragLeave={() => {
                              setDropTargetListForTask(null);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              // Handle list reorder
                              const sourceListId = e.dataTransfer.getData("text/plain") || draggingListId;
                              const sourceGroupId = e.dataTransfer.getData("application/group-id");
                              if (sourceListId && sourceGroupId === group.id && draggingListId) {
                                void handleReorderLists(sourceListId, list.id, group.id);
                              }
                              // Handle task move to different list
                              const sourceTaskId = e.dataTransfer.getData("application/task-id");
                              const sourceTaskListId = e.dataTransfer.getData("application/list-id");
                              if (sourceTaskId && sourceTaskListId !== list.id) {
                                void handleMoveTask(sourceTaskId, list.id);
                              }
                              setDraggingListId(null);
                              setDropTargetListId(null);
                              setDropTargetListForTask(null);
                            }}
                            onClick={() => {
                              setSelectedListId(list.id);
                              setCurrentView('list');
                            }}
                            onContextMenu={(e) => handleListContextMenu(e, list)}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                              draggingListId === list.id ? "opacity-60" : ""
                            } ${
                              dropTargetListId === list.id && draggingListId !== list.id
                                ? "ring-2 ring-violet-300 dark:ring-violet-700"
                                : ""
                            } ${
                              dropTargetListForTask === list.id && draggingTaskId
                                ? "ring-2 ring-green-300 dark:ring-green-700 bg-green-50 dark:bg-green-900/20"
                                : ""
                            } ${
                              selectedListId === list.id
                                ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            }`}
                          >
                            <List className="w-4 h-4" />
                            <span className="truncate">{list.name}</span>
                          </button>
                        ))}

                        {/* New list input */}
                        {showNewListInput === group.id ? (
                          <div className="px-3 py-2 bg-white dark:bg-zinc-700 rounded-lg border border-zinc-200 dark:border-zinc-600">
                            <input
                              type="text"
                              value={newListName}
                              onChange={(e) => setNewListName(e.target.value)}
                              placeholder="List name"
                              className="w-full px-2 py-1 text-sm bg-transparent border-none outline-none text-zinc-900 dark:text-white placeholder-zinc-400"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleCreateList(group.id);
                                if (e.key === "Escape") {
                                  setShowNewListInput(null);
                                  setNewListName("");
                                }
                              }}
                            />
                            <div className="flex items-center justify-end gap-2 mt-2">
                              <button
                                onClick={() => {
                                  setShowNewListInput(null);
                                  setNewListName("");
                                }}
                                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-600 text-zinc-400"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCreateList(group.id)}
                                disabled={isCreatingList || !newListName.trim()}
                                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-600 text-green-500 disabled:opacity-50"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowNewListInput(group.id)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add list</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Empty state */}
              {!isLoading && groups.length === 0 && !showNewGroupInput && (
                <div className="px-3 py-4 text-sm text-zinc-400 dark:text-zinc-500">
                  No groups yet. Click + to create one.
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="text-sm">
                <p className="font-medium text-zinc-900 dark:text-white truncate max-w-24">
                  {user?.name || user?.email?.split("@")[0] || "User"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <AccountSettingsDialog
                onAccountChanged={handleAccountChanged}
                trigger={(
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    title="Account Settings"
                  >
                    <Users className="w-4 h-4" />
                  </Button>
                )}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
            {getHeaderTitle()}
          </h1>
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs bg-zinc-200 dark:bg-zinc-700 rounded">
              ⌘K
            </kbd>
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            {/* New task input */}
            {selectedList && (
              <div className="mb-4">
                {showNewTaskInput ? (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                    <div className="w-5 h-5 rounded-full border border-zinc-300 dark:border-zinc-600" />
                    <input
                      type="text"
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      placeholder="Enter task name..."
                      className="flex-1 bg-transparent border-none outline-none text-zinc-800 dark:text-zinc-100 placeholder-zinc-400"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateTask();
                        if (e.key === "Escape") {
                          setShowNewTaskInput(false);
                          setNewTaskName("");
                        }
                      }}
                      disabled={isCreatingTask}
                    />
                    <button
                      onClick={handleCreateTask}
                      disabled={isCreatingTask || !newTaskName.trim()}
                      className="p-1.5 rounded-lg bg-violet-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-violet-500"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setShowNewTaskInput(false);
                        setNewTaskName("");
                      }}
                      className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    >
                      <X className="w-4 h-4 text-zinc-500" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewTaskInput(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-400 hover:border-violet-300 hover:text-violet-500 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add a task</span>
                  </button>
                )}
              </div>
            )}

            {(() => {
              const displayTasks = getDisplayTasks();
              const showAddTask = currentView === 'list' && selectedList;

              if (displayTasks.length > 0) {
                return (
                  <div className="space-y-2">
                    {displayTasks.map((task) => renderTaskItem(task, 0))}
                  </div>
                );
              }

              // Empty state based on view
              return (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
                  </div>
                  <h2 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">
                    {isLoadingTasks
                      ? "Loading tasks..."
                      : currentView === 'today'
                      ? "No tasks for today"
                      : currentView === 'starred'
                      ? "No starred tasks"
                      : selectedList
                      ? `No tasks in "${selectedList.name}"`
                      : "No tasks yet"}
                  </h2>
                  <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                    {currentView === 'today'
                      ? "Tasks with due date or planned date of today will appear here"
                      : currentView === 'starred'
                      ? "Star important tasks to see them here"
                      : "Get started by creating your first task"}
                  </p>
                  {showAddTask && (
                    <Button
                      onClick={() => setShowNewTaskInput(true)}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Task</span>
                    </Button>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </main>

      {/* Context Menu for Groups */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-32 bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg shadow-lg py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => openEditDialog(contextMenu.group)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-600"
          >
            <Pencil className="w-4 h-4" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => handleDeleteGroup(contextMenu.group.id)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-600"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Context Menu for Lists */}
      {listContextMenu && (
        <div
          className="fixed z-50 min-w-32 bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg shadow-lg py-1"
          style={{ left: listContextMenu.x, top: listContextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => openEditListDialog(listContextMenu.list)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-600"
          >
            <Pencil className="w-4 h-4" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => openMoveListDialog(listContextMenu.list)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-600"
          >
            <Move className="w-4 h-4" />
            <span>Move</span>
          </button>
          <button
            onClick={() => handleDeleteList(listContextMenu.list.id)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-600"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Context Menu for Tasks */}
      {taskContextMenu && (
        <div
          className="fixed z-50 min-w-32 bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg shadow-lg py-1"
          style={{ left: taskContextMenu.x, top: taskContextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              startEditTask(taskContextMenu.taskId, taskContextMenu.taskName);
              setTaskContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-600"
          >
            <Pencil className="w-4 h-4" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => handleDeleteTask(taskContextMenu.taskId)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-600"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Edit Group Dialog */}
      <Dialog open={!!editingGroup} onOpenChange={(open) => !open && setEditingGroup(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Group Name
              </label>
              <input
                type="text"
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                placeholder="Enter group name"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdateGroup();
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Color
              </label>
              <div className="flex items-center gap-2">
                {GROUP_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setEditGroupColor(color.value)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      editGroupColor === color.value ? "ring-2 ring-offset-2 ring-violet-500 scale-110" : ""
                    }`}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setEditingGroup(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateGroup}
              disabled={isUpdatingGroup || !editGroupName.trim()}
            >
              {isUpdatingGroup ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit List Dialog */}
      <Dialog open={!!editingList} onOpenChange={(open) => !open && setEditingList(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                List Name
              </label>
              <input
                type="text"
                value={editListName}
                onChange={(e) => setEditListName(e.target.value)}
                placeholder="Enter list name"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdateList();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setEditingList(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateList}
              disabled={isUpdatingList || !editListName.trim()}
            >
              {isUpdatingList ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move List Dialog */}
      <Dialog open={!!movingList} onOpenChange={(open) => !open && setMovingList(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Move List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Move <strong>{movingList?.name}</strong> to a different group:
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Target Group
              </label>
              <select
                value={targetGroupId}
                onChange={(e) => setTargetGroupId(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setMovingList(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMoveList}
              disabled={isMovingList || !targetGroupId || targetGroupId === movingList?.group_id}
            >
              {isMovingList ? "Moving..." : "Move List"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              {/* Task Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Task Name
                </label>
                <div className="text-zinc-900 dark:text-zinc-100">{selectedTask.name}</div>
              </div>

              {/* Subtasks */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Subtasks
                  </label>
                  {!showAddSubtask && (
                    <button
                      onClick={() => setShowAddSubtask(true)}
                      className="text-xs text-violet-600 hover:text-violet-700"
                    >
                      + Add subtask
                    </button>
                  )}
                </div>
                {showAddSubtask && (
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={newSubtaskName}
                      onChange={(e) => setNewSubtaskName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateSubtask();
                        if (e.key === "Escape") {
                          setShowAddSubtask(false);
                          setNewSubtaskName("");
                        }
                      }}
                      placeholder="Subtask name..."
                      className="flex-1 px-3 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      autoFocus
                    />
                    <button
                      onClick={handleCreateSubtask}
                      className="p-1 text-green-500 hover:text-green-600"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setShowAddSubtask(false);
                        setNewSubtaskName("");
                      }}
                      className="p-1 text-zinc-500 hover:text-zinc-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {/* List subtasks */}
                {tasks
                  .filter((t) => t.parent_id === selectedTask.id)
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-2 py-1 px-2 bg-zinc-50 dark:bg-zinc-800 rounded"
                    >
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center cursor-pointer ${
                          subtask.completed
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-zinc-300 dark:border-zinc-600"
                        }`}
                        onClick={() => toggleTaskComplete(subtask.id, subtask.completed)}
                      >
                        {subtask.completed ? <Check className="w-3 h-3" /> : null}
                      </div>
                      <span
                        className={`flex-1 text-sm ${
                          subtask.completed
                            ? "line-through text-zinc-400"
                            : "text-zinc-800 dark:text-zinc-100"
                        }`}
                      >
                        {subtask.name}
                      </span>
                    </div>
                  ))}
                {tasks.filter((t) => t.parent_id === selectedTask.id).length === 0 &&
                  !showAddSubtask && (
                    <div className="text-sm text-zinc-400 italic">No subtasks yet</div>
                  )}
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Due Date
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={selectedTask.due_date || ""}
                    onChange={(e) => {
                      const newDate = e.target.value || null;
                      updateTaskDueDate(selectedTask.id, newDate);
                    }}
                    className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                  {selectedTask.due_date && (
                    <button
                      onClick={() => updateTaskDueDate(selectedTask.id, null)}
                      className="p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                      title="Clear due date"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Planned Date */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Planned Date
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={selectedTask.plan_date || ""}
                    onChange={(e) => {
                      const newDate = e.target.value || null;
                      updateTaskPlanDate(selectedTask.id, newDate);
                    }}
                    className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                  {selectedTask.plan_date && (
                    <button
                      onClick={() => updateTaskPlanDate(selectedTask.id, null)}
                      className="p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                      title="Clear planned date"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Completed Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedTask.completed}
                  onChange={() => toggleTaskComplete(selectedTask.id, selectedTask.completed)}
                  className="w-4 h-4"
                  id="task-completed"
                />
                <label htmlFor="task-completed" className="text-sm text-zinc-700 dark:text-zinc-300">
                  Marked as completed
                </label>
              </div>

              {/* Comment/Notes */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={selectedTask.comment || ""}
                  onChange={(e) => {
                    const newComment = e.target.value;
                    // Auto-save on blur
                    updateTaskComment(selectedTask.id, newComment);
                  }}
                  onBlur={(e) => {
                    const newComment = e.target.value;
                    updateTaskComment(selectedTask.id, newComment);
                  }}
                  placeholder="Add notes..."
                  rows={3}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Duration (minutes)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={selectedTask.duration_minutes || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      const duration = value ? parseInt(value, 10) : null;
                      updateTaskDuration(selectedTask.id, duration);
                    }}
                    onBlur={(e) => {
                      const value = e.target.value;
                      const duration = value ? parseInt(value, 10) : null;
                      updateTaskDuration(selectedTask.id, duration);
                    }}
                    placeholder="e.g. 30"
                    className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                  {selectedTask.duration_minutes && (
                    <button
                      onClick={() => updateTaskDuration(selectedTask.id, null)}
                      className="p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                      title="Clear duration"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Starred Status */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleTaskStar(selectedTask.id, selectedTask.starred)}
                  className={`p-1 rounded ${
                    selectedTask.starred ? "text-yellow-500" : "text-zinc-300 dark:text-zinc-600"
                  }`}
                >
                  <Star className="w-5 h-5" fill={selectedTask.starred ? "currentColor" : "none"} />
                </button>
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {selectedTask.starred ? "Starred" : "Not starred"}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedTask(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search Dialog */}
      <Dialog open={showSearch} onOpenChange={setShowSearch}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Search Tasks</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks by name..."
                className="w-full pl-10 pr-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                autoFocus
              />
            </div>
            {/* Search Results */}
            <div className="max-h-80 overflow-y-auto">
              {searchQuery.trim() ? (
                searchTasks(searchQuery).length > 0 ? (
                  <div className="space-y-2">
                    {searchTasks(searchQuery).map((task) => {
                      const taskList = lists.find((l) => l.id === task.list_id);
                      const taskGroup = taskList
                        ? groups.find((g) => g.id === taskList.group_id)
                        : null;
                      return (
                        <button
                          key={task.id}
                          onClick={() => {
                            // Navigate to the task's list and close search
                            setSelectedListId(task.list_id);
                            setShowSearch(false);
                            setSearchQuery("");
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-left"
                        >
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                              task.completed
                                ? "border-green-500 bg-green-500 text-white"
                                : "border-zinc-300 dark:border-zinc-600"
                            }`}
                          >
                            {task.completed && <Check className="w-3 h-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className={`text-sm truncate ${
                                task.completed
                                  ? "line-through text-zinc-400"
                                  : "text-zinc-900 dark:text-zinc-100"
                              }`}
                            >
                              {task.name}
                            </div>
                            <div className="text-xs text-zinc-400 truncate">
                              {taskGroup?.name} / {taskList?.name}
                            </div>
                          </div>
                          {task.starred && (
                            <Star
                              className="w-4 h-4 text-yellow-500 flex-shrink-0"
                              fill="currentColor"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No tasks found matching "{searchQuery}"</p>
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Type to search tasks</p>
                  <p className="text-xs mt-1">Search across all lists</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSearch(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DashboardPage;
