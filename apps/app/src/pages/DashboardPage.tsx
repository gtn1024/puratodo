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
  Menu,
  Circle,
} from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Sheet,
  SheetContent,
  DragHandle,
} from "@puratodo/ui";
import { TaskFilters, TaskBulkActions, type TaskFiltersValue, filterTasksByFilterValue } from "@puratodo/task-ui";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AccountSettingsDialog } from "@/components/AccountSettingsDialog";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import { TaskDetailPanel } from "@/components/TaskDetailPanel";
import { TaskDetailSheet } from "@/components/TaskDetailSheet";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useBreakpoint } from "@/hooks/useBreakpoint";
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

  // DnD state for tracking active item (setters are used in handlers)
  const [, setActiveGroupId] = React.useState<UniqueIdentifier | null>(null);
  const [, setActiveListId] = React.useState<UniqueIdentifier | null>(null);
  const [, setActiveTaskId] = React.useState<UniqueIdentifier | null>(null);
  const [, setActiveTaskParentId] = React.useState<string | null>(null);

  // Create task state
  const [showNewTaskInput, setShowNewTaskInput] = React.useState(false);
  const [newTaskName, setNewTaskName] = React.useState("");
  const [isCreatingTask, setIsCreatingTask] = React.useState(false);

  // Filter state
  const [filterValues, setFilterValues] = React.useState<TaskFiltersValue>({
    status: 'all',
    star: 'all',
    date: 'all',
  });

  // Multi-select state
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = React.useState<Set<string>>(new Set());

  // Bulk date dialog state
  const [isBulkDateDialogOpen, setIsBulkDateDialogOpen] = React.useState(false);
  const [bulkDateValue, setBulkDateValue] = React.useState<Date | undefined>(undefined);

  // Bulk delete dialog state
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = React.useState(false);

  // Edit task state
  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null);
  const [editingTaskName, setEditingTaskName] = React.useState("");

  // Add subtask state
  const [addingSubtaskTo, setAddingSubtaskTo] = React.useState<string | null>(null);
  const [newSubtaskName, setNewSubtaskName] = React.useState("");

  // Context menu state for tasks
  const [taskContextMenu, setTaskContextMenu] = React.useState<{
    x: number;
    y: number;
    taskId: string;
    taskName: string;
  } | null>(null);

  // Responsive three-column layout state
  const { showDetailPanel, showSidebarSheet, isXs } = useBreakpoint();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = React.useState(false);

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

  // Start adding subtask to a task
  const startAddSubtask = (taskId: string) => {
    setAddingSubtaskTo(taskId);
    setNewSubtaskName("");
    // Expand parent task
    if (!expandedTasks.has(taskId)) {
      setExpandedTasks(new Set(expandedTasks).add(taskId));
    }
    setTaskContextMenu(null);
  };

  // Handle adding subtask
  const handleAddSubtask = async (parentId: string) => {
    if (!newSubtaskName.trim()) return;
    const parentTask = tasks.find((t) => t.id === parentId);
    if (!parentTask) return;

    try {
      await createTask({
        list_id: parentTask.list_id,
        name: newSubtaskName.trim(),
        parent_id: parentId,
      });
      setNewSubtaskName("");
      setAddingSubtaskTo(null);
    } catch (err) {
      console.error("Failed to create subtask:", err);
    }
  };

  // Cancel adding subtask
  const cancelAddSubtask = () => {
    setNewSubtaskName("");
    setAddingSubtaskTo(null);
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

  // Multi-select handlers
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
    const allTaskIds = getDisplayTasks().map(t => t.id);
    setSelectedTaskIds(new Set(allTaskIds));
  };

  const handleDeselectAll = () => {
    setSelectedTaskIds(new Set());
  };

  const handleExitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedTaskIds(new Set());
  };

  // Bulk operation handlers
  const handleBulkComplete = async (completed: boolean) => {
    const taskIds = Array.from(selectedTaskIds);
    try {
      await Promise.all(taskIds.map(id => updateTask(id, { completed })));
      setSelectedTaskIds(new Set());
    } catch (err) {
      console.error("Failed to bulk complete tasks:", err);
    }
  };

  const handleBulkStar = async (starred: boolean) => {
    const taskIds = Array.from(selectedTaskIds);
    try {
      await Promise.all(taskIds.map(id => updateTask(id, { starred })));
      setSelectedTaskIds(new Set());
    } catch (err) {
      console.error("Failed to bulk star tasks:", err);
    }
  };

  const handleBulkDelete = async () => {
    const taskIds = Array.from(selectedTaskIds);
    setIsBulkDeleteDialogOpen(false);
    try {
      await Promise.all(taskIds.map(id => deleteTask(id)));
      setSelectedTaskIds(new Set());
      setIsSelectionMode(false);
    } catch (err) {
      console.error("Failed to bulk delete tasks:", err);
    }
  };

  const handleBulkSetDate = async () => {
    const taskIds = Array.from(selectedTaskIds);
    const dateStr = bulkDateValue ? bulkDateValue.toISOString().split('T')[0] : null;
    setIsBulkDateDialogOpen(false);
    try {
      await Promise.all(taskIds.map(id => updateTask(id, { due_date: dateStr })));
      setBulkDateValue(undefined);
      setSelectedTaskIds(new Set());
    } catch (err) {
      console.error("Failed to bulk set date:", err);
    }
  };

  const selectedCount = selectedTaskIds.size;

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

  // Keyboard shortcut for search (Ctrl+K / Cmd+K) and new task (Ctrl+N / Cmd+N)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        if (!selectedListId) {
          alert("Please select a list first");
          return;
        }
        setShowNewTaskInput(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedListId]);

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
    let tasks: Task[];
    if (currentView === 'today') {
      tasks = getTodayTasks();
    } else if (currentView === 'starred') {
      tasks = getStarredTasks();
    } else if (selectedListId) {
      tasks = getRootTasks(selectedListId);
    } else {
      tasks = [];
    }

    // Apply filters
    return filterTasksByFilterValue(tasks, filterValues);
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

  // Configure sensors for @dnd-kit
  const groupSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const listSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const taskSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group drag handlers
  const handleGroupDragStart = (event: DragStartEvent) => {
    setActiveGroupId(event.active.id);
  };

  const handleGroupDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveGroupId(null);

    if (over && active.id !== over.id) {
      const fromIndex = groups.findIndex((g) => g.id === active.id);
      const toIndex = groups.findIndex((g) => g.id === over.id);
      if (fromIndex !== -1 && toIndex !== -1) {
        const nextGroups = arrayMove(groups, fromIndex, toIndex);
        void reorderGroups(nextGroups.map((g) => g.id));
      }
    }
  };

  // List drag handlers
  const handleListDragStart = (event: DragStartEvent, _groupId: string) => {
    setActiveListId(event.active.id);
  };

  const handleListDragEnd = (event: DragEndEvent, groupId: string) => {
    const { active, over } = event;
    setActiveListId(null);

    if (over && active.id !== over.id) {
      const groupLists = lists.filter((l) => l.group_id === groupId);
      const fromIndex = groupLists.findIndex((l) => l.id === active.id);
      const toIndex = groupLists.findIndex((l) => l.id === over.id);
      if (fromIndex !== -1 && toIndex !== -1) {
        const nextLists = arrayMove(groupLists, fromIndex, toIndex);
        void reorderLists(nextLists.map((l) => l.id));
      }
    }
  };

  // Task drag handlers
  const handleTaskDragStart = (event: DragStartEvent, parentId: string | null) => {
    setActiveTaskId(event.active.id);
    setActiveTaskParentId(parentId);
  };

  const handleTaskDragEnd = (event: DragEndEvent, listId: string, parentId: string | null) => {
    const { active, over } = event;
    setActiveTaskId(null);
    setActiveTaskParentId(null);

    if (over && active.id !== over.id) {
      if (parentId) {
        // Reordering subtasks within same parent
        const siblingSubtasks = tasks.filter((t) => t.parent_id === parentId);
        const fromIndex = siblingSubtasks.findIndex((t) => t.id === active.id);
        const toIndex = siblingSubtasks.findIndex((t) => t.id === over.id);
        if (fromIndex !== -1 && toIndex !== -1) {
          const nextSubtasks = arrayMove(siblingSubtasks, fromIndex, toIndex);
          void reorderTasks(nextSubtasks.map((t) => t.id));
        }
      } else {
        // Reordering root tasks within same list
        const listTasks = tasks.filter((t) => t.list_id === listId && !t.parent_id);
        const fromIndex = listTasks.findIndex((t) => t.id === active.id);
        const toIndex = listTasks.findIndex((t) => t.id === over.id);
        if (fromIndex !== -1 && toIndex !== -1) {
          const nextTasks = arrayMove(listTasks, fromIndex, toIndex);
          void reorderTasks(nextTasks.map((t) => t.id));
        }
      }
    }
  };

  // Sortable Group Item component
  interface SortableGroupItemProps {
    group: Group;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onContextMenu: (e: React.MouseEvent, group: Group) => void;
    onDelete: (groupId: string, e?: React.MouseEvent) => void;
  }

  function SortableGroupItem({ group, isExpanded, onToggleExpand, onContextMenu, onDelete }: SortableGroupItemProps) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: group.id });

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 50 : undefined,
    };

    return (
      <div ref={setNodeRef} style={style} className={isDragging ? "z-50" : ""}>
        <div
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors group select-none ${
            isDragging ? "bg-stone-100 dark:bg-stone-800" : ""
          }`}
          onClick={onToggleExpand}
          onContextMenu={(e) => onContextMenu(e, group)}
        >
          {/* Drag Handle */}
          <DragHandle attributes={attributes} listeners={listeners} iconSize="sm" />
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
          />
          <Folder className="w-5 h-5" style={{ color: group.color ?? undefined }} />
          <span className="flex-1 text-left truncate">{group.name}</span>
          <button
            onClick={(e) => onDelete(group.id, e)}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-400 hover:text-red-500"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  // Sortable List Item component
  interface SortableListItemProps {
    list: ListType;
    isSelected: boolean;
    onSelect: (listId: string, groupId: string) => void;
    onContextMenu: (e: React.MouseEvent, list: ListType) => void;
    groupId: string;
  }

  function SortableListItem({ list, isSelected, onSelect, onContextMenu, groupId }: SortableListItemProps) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: list.id });

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 50 : undefined,
    };

    return (
      <div ref={setNodeRef} style={style} className={isDragging ? "z-50" : ""}>
        <div
          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors select-none group ${
            isDragging ? "bg-stone-100 dark:bg-stone-800" : ""
          } ${
            isSelected
              ? "bg-stone-100 dark:bg-stone-800/30 text-stone-800 dark:text-stone-200"
              : "text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
          }`}
          onClick={() => onSelect(list.id, groupId)}
          onContextMenu={(e) => onContextMenu(e, list)}
        >
          {/* Drag Handle */}
          <DragHandle attributes={attributes} listeners={listeners} iconSize="sm" />
          <List className="w-4 h-4" />
          <span className="truncate flex-1">{list.name}</span>
        </div>
      </div>
    );
  }

  // Sortable Task Item component
  interface SortableTaskItemProps {
    task: Task;
    depth: number;
    parentId?: string;
  }

  function SortableTaskItem({ task, depth, parentId: _parentId }: SortableTaskItemProps) {
    const subtasks = getSubtasks(task.id);
    const hasSubtasks = subtasks.length > 0;
    const isExpanded = expandedTasks.has(task.id);
    const indentPadding = depth * 24;
    const hasIncompleteSubtasks = hasSubtasks && subtasks.some((st) => !st.completed);
    const listId = task.list_id;

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: task.id });

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      marginLeft: indentPadding,
      zIndex: isDragging ? 50 : undefined,
    };

    return (
      <div className="space-y-2">
        <div
          ref={setNodeRef}
          style={style}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 select-none group ${
            isDragging ? "z-50 shadow-lg" : ""
          }`}
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
          {/* Drag Handle */}
          <DragHandle attributes={attributes} listeners={listeners} iconSize="sm" />
          {/* Selection checkbox - only shown in selection mode */}
          {isSelectionMode && (
            <button
              onClick={() => handleToggleSelect(task.id)}
              className={`p-0.5 rounded hover:bg-stone-100 dark:hover:bg-stone-700 ${
                selectedTaskIds.has(task.id)
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-stone-300 dark:text-stone-600"
              }`}
            >
              {selectedTaskIds.has(task.id) ? (
                <Check className="w-5 h-5" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </button>
          )}
          {/* Expand/collapse button for tasks with subtasks */}
          {hasSubtasks ? (
            <button
              onClick={() => toggleTaskExpand(task.id)}
              className="p-0.5 rounded hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-400"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}
          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer hover:border-green-500 ${
              task.completed
                ? "border-green-500 bg-green-500 text-white"
                : hasIncompleteSubtasks
                ? "border-stone-400 bg-stone-100 dark:bg-stone-700"
                : "border-stone-300 dark:border-stone-600"
            }`}
            onClick={() => toggleTaskComplete(task.id, task.completed)}
          >
            {task.completed ? (
              <Check className="w-3 h-3" />
            ) : hasIncompleteSubtasks ? (
              <div className="w-2 h-2 rounded-full bg-stone-500" />
            ) : null}
          </div>
          {editingTaskId === task.id ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={editingTaskName}
                onChange={(e) => setEditingTaskName(e.target.value)}
                className="flex-1 bg-transparent border border-stone-300 dark:border-stone-600 rounded px-2 py-1 text-sm text-stone-800 dark:text-stone-100 outline-none focus:border-stone-400"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEditTask();
                  if (e.key === "Escape") cancelEditTask();
                }}
                onBlur={saveEditTask}
              />
              <button
                onClick={saveEditTask}
                className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-700"
              >
                <Check className="w-4 h-4 text-green-500" />
              </button>
              <button
                onClick={cancelEditTask}
                className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-700"
              >
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>
          ) : (
            <>
              <span
                className={`flex-1 text-sm cursor-pointer hover:text-stone-600 dark:hover:text-stone-300 ${
                  task.completed
                    ? "line-through text-stone-400 dark:text-stone-500"
                    : "text-stone-800 dark:text-stone-100"
                }`}
                onClick={() => startEditTask(task.id, task.name)}
              >
                {task.name}
              </span>
              <button
                onClick={() => toggleTaskStar(task.id, task.starred)}
                className={`p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-700 ${
                  task.starred ? "text-yellow-500" : "text-stone-300 dark:text-stone-600"
                }`}
              >
                <Star className="w-4 h-4" fill={task.starred ? "currentColor" : "none"} />
              </button>
              <button
                onClick={() => {
                  setSelectedTaskId(task.id);
                  if (!showDetailPanel) {
                    setMobileDetailOpen(true);
                  }
                }}
                className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-400"
                title="Task details"
              >
                <Calendar className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        {/* Render subtasks recursively with DndContext */}
        {hasSubtasks && isExpanded && (
          <DndContext
            sensors={taskSensors}
            collisionDetection={closestCenter}
            onDragStart={(e) => handleTaskDragStart(e, task.id)}
            onDragEnd={(e) => handleTaskDragEnd(e, listId, task.id)}
          >
            <SortableContext
              items={subtasks.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 mt-1">
                {subtasks
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((subtask) => (
                    <SortableTaskItem
                      key={subtask.id}
                      task={subtask}
                      depth={depth + 1}
                      parentId={task.id}
                    />
                  ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
        {/* Inline subtask input */}
        {addingSubtaskTo === task.id && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
            style={{ marginLeft: indentPadding + 24 }}
          >
            <Circle className="w-5 h-5 text-stone-300 dark:text-stone-600" />
            <input
              type="text"
              value={newSubtaskName}
              onChange={(e) => setNewSubtaskName(e.target.value)}
              placeholder="Subtask name..."
              className="flex-1 bg-transparent border-none outline-none text-stone-800 dark:text-stone-100 placeholder-stone-400 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddSubtask(task.id);
                if (e.key === "Escape") cancelAddSubtask();
              }}
            />
            <button
              onClick={() => handleAddSubtask(task.id)}
              disabled={!newSubtaskName.trim()}
              className="p-1.5 rounded-lg bg-stone-900 dark:bg-stone-700 text-white dark:text-stone-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-800 dark:hover:bg-stone-600"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={cancelAddSubtask}
              className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700"
            >
              <X className="w-4 h-4 text-stone-500" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex">
      {/* Mobile Sidebar - Sheet (xs only) */}
      {showSidebarSheet && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-64" showCloseButton={false}>
            {/* Sidebar Content */}
            <div className="h-full bg-stone-50 dark:bg-stone-900 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-stone-800 to-stone-600 dark:from-stone-100 dark:to-stone-300 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white dark:text-stone-900" />
            </div>
            <span className="text-lg font-semibold text-stone-900 dark:text-stone-100">PuraToDo</span>
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
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-stone-900 dark:bg-stone-700 text-white dark:text-stone-100 text-sm font-medium hover:bg-stone-800 dark:hover:bg-stone-600 transition-all shadow-lg shadow-stone-900/20 dark:shadow-stone-900/40"
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
                  ? "bg-stone-100 dark:bg-stone-800/30 text-stone-800 dark:text-stone-200"
                  : "text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
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
                  ? "bg-stone-100 dark:bg-stone-800/30 text-stone-800 dark:text-stone-200"
                  : "text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
              }`}
            >
              <Star className="w-5 h-5" />
              <span>Starred</span>
            </button>
          </div>

          {/* Groups section */}
          <div className="mt-6">
            <div className="flex items-center justify-between px-3 mb-2">
              <h3 className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                Groups
              </h3>
              <button
                onClick={() => setShowNewGroupInput(true)}
                className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* New group input */}
            {showNewGroupInput && (
              <div className="px-3 py-2 mb-2 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-600">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Group name"
                  className="w-full px-2 py-1 text-sm bg-transparent border-none outline-none text-stone-900 dark:text-stone-100 placeholder-stone-400"
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
                    className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCreateGroup}
                    disabled={isCreatingGroup || !newGroupName.trim()}
                    className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-700 text-green-500 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Loading state */}
            {isLoading && groups.length === 0 && (
              <div className="px-3 py-4 text-sm text-stone-400 dark:text-stone-500">Loading...</div>
            )}

            {/* Error state */}
            {error && (
              <div className="px-3 py-4 text-sm text-red-500 dark:text-red-400">{error}</div>
            )}

            {/* Groups list */}
            <DndContext
              sensors={groupSensors}
              collisionDetection={closestCenter}
              onDragStart={handleGroupDragStart}
              onDragEnd={handleGroupDragEnd}
            >
              <SortableContext
                items={groups.map((g) => g.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {groups.map((group) => {
                    const groupLists = getListsForGroup(group.id);
                    const isExpanded = expandedGroups.has(group.id);

                    return (
                      <div key={group.id}>
                        <SortableGroupItem
                          group={group}
                          isExpanded={isExpanded}
                          onToggleExpand={() => toggleGroup(group.id)}
                          onContextMenu={handleContextMenu}
                          onDelete={handleDeleteGroup}
                        />

                        {/* Lists under group */}
                        {isExpanded && (
                          <DndContext
                            sensors={listSensors}
                            collisionDetection={closestCenter}
                            onDragStart={(e) => handleListDragStart(e, group.id)}
                            onDragEnd={(e) => handleListDragEnd(e, group.id)}
                          >
                            <SortableContext
                              items={groupLists.map((l) => l.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="ml-6 mt-1 space-y-1">
                                {groupLists.map((list) => (
                                  <SortableListItem
                                    key={list.id}
                                    list={list}
                                    groupId={group.id}
                                    isSelected={selectedListId === list.id}
                                    onSelect={(listId) => {
                                      setSelectedListId(listId);
                                      setCurrentView('list');
                                    }}
                                    onContextMenu={handleListContextMenu}
                                  />
                                ))}

                                {/* New list input */}
                                {showNewListInput === group.id ? (
                                  <div className="px-3 py-2 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-600">
                                    <input
                                      type="text"
                                      value={newListName}
                                      onChange={(e) => setNewListName(e.target.value)}
                                      placeholder="List name"
                                      className="w-full px-2 py-1 text-sm bg-transparent border-none outline-none text-stone-900 dark:text-stone-100 placeholder-stone-400"
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
                                        className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-400"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleCreateList(group.id)}
                                        disabled={isCreatingList || !newListName.trim()}
                                        className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-700 text-green-500 disabled:opacity-50"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setShowNewListInput(group.id)}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-stone-400 dark:text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                                  >
                                    <Plus className="w-4 h-4" />
                                    <span>Add list</span>
                                  </button>
                                )}
                              </div>
                            </SortableContext>
                          </DndContext>
                        )}
                      </div>
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>

              {/* Empty state */}
              {!isLoading && groups.length === 0 && !showNewGroupInput && (
                <div className="px-3 py-4 text-sm text-stone-400 dark:text-stone-500">
                  No groups yet. Click + to create one.
                </div>
              )}
            </div>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stone-700 to-stone-500 flex items-center justify-center text-white dark:text-stone-100 text-sm font-medium">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="text-sm">
                <p className="font-medium text-stone-900 dark:text-stone-100 truncate max-w-24">
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
                    className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
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
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
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
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop Sidebar - fixed (sm and above) */}
      {!showSidebarSheet && (
        <aside className="w-64 bg-stone-50 dark:bg-stone-900 border-r border-stone-200 dark:border-stone-700 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-stone-800 to-stone-600 dark:from-stone-100 dark:to-stone-300 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white dark:text-stone-900" />
            </div>
            <span className="text-lg font-semibold text-stone-900 dark:text-stone-100">PuraToDo</span>
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
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-stone-900 dark:bg-stone-700 text-white dark:text-stone-100 text-sm font-medium hover:bg-stone-800 dark:hover:bg-stone-600 transition-all shadow-lg shadow-stone-900/20 dark:shadow-stone-900/40"
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
                  ? "bg-stone-100 dark:bg-stone-800/30 text-stone-800 dark:text-stone-200"
                  : "text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
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
                  ? "bg-stone-100 dark:bg-stone-800/30 text-stone-800 dark:text-stone-200"
                  : "text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
              }`}
            >
              <Star className="w-5 h-5" />
              <span>Starred</span>
            </button>
          </div>

          {/* Groups section */}
          <div className="mt-6">
            <div className="flex items-center justify-between px-3 mb-2">
              <h3 className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                Groups
              </h3>
              <button
                onClick={() => setShowNewGroupInput(true)}
                className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* New group input */}
            {showNewGroupInput && (
              <div className="px-3 py-2 mb-2 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-600">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Group name"
                  className="w-full px-2 py-1 text-sm bg-transparent border-none outline-none text-stone-900 dark:text-stone-100 placeholder-stone-400"
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
                    className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCreateGroup}
                    disabled={isCreatingGroup || !newGroupName.trim()}
                    className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-700 text-green-500 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Loading state */}
            {isLoading && groups.length === 0 && (
              <div className="px-3 py-4 text-sm text-stone-400 dark:text-stone-500">Loading...</div>
            )}

            {/* Error state */}
            {error && (
              <div className="px-3 py-4 text-sm text-red-500 dark:text-red-400">{error}</div>
            )}

            {/* Groups list */}
            <DndContext
              sensors={groupSensors}
              collisionDetection={closestCenter}
              onDragStart={handleGroupDragStart}
              onDragEnd={handleGroupDragEnd}
            >
              <SortableContext
                items={groups.map((g) => g.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {groups.map((group) => {
                    const groupLists = getListsForGroup(group.id);
                    const isExpanded = expandedGroups.has(group.id);

                    return (
                      <div key={group.id}>
                        <SortableGroupItem
                          group={group}
                          isExpanded={isExpanded}
                          onToggleExpand={() => toggleGroup(group.id)}
                          onContextMenu={handleContextMenu}
                          onDelete={handleDeleteGroup}
                        />

                        {/* Lists under group */}
                        {isExpanded && (
                          <DndContext
                            sensors={listSensors}
                            collisionDetection={closestCenter}
                            onDragStart={(e) => handleListDragStart(e, group.id)}
                            onDragEnd={(e) => handleListDragEnd(e, group.id)}
                          >
                            <SortableContext
                              items={groupLists.map((l) => l.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="ml-6 mt-1 space-y-1">
                                {groupLists.map((list) => (
                                  <SortableListItem
                                    key={list.id}
                                    list={list}
                                    groupId={group.id}
                                    isSelected={selectedListId === list.id}
                                    onSelect={(listId) => {
                                      setSelectedListId(listId);
                                      setCurrentView('list');
                                      setSidebarOpen(false); // Close mobile sidebar on selection
                                    }}
                                    onContextMenu={handleListContextMenu}
                                  />
                                ))}

                                {/* New list input */}
                                {showNewListInput === group.id ? (
                                  <div className="px-3 py-2 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-600">
                                    <input
                                      type="text"
                                      value={newListName}
                                      onChange={(e) => setNewListName(e.target.value)}
                                      placeholder="List name"
                                      className="w-full px-2 py-1 text-sm bg-transparent border-none outline-none text-stone-900 dark:text-stone-100 placeholder-stone-400"
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
                                        className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-400"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleCreateList(group.id)}
                                        disabled={isCreatingList || !newListName.trim()}
                                        className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-700 text-green-500 disabled:opacity-50"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setShowNewListInput(group.id)}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-stone-400 dark:text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                                  >
                                    <Plus className="w-4 h-4" />
                                    <span>Add list</span>
                                  </button>
                                )}
                              </div>
                            </SortableContext>
                          </DndContext>
                        )}
                      </div>
                    );
                  })}

                  {/* Empty state */}
                  {!isLoading && groups.length === 0 && !showNewGroupInput && (
                    <div className="px-3 py-4 text-sm text-stone-400 dark:text-stone-500">
                      No groups yet. Click + to create one.
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stone-700 to-stone-500 flex items-center justify-center text-white dark:text-stone-100 text-sm font-medium">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="text-sm">
                <p className="font-medium text-stone-900 dark:text-stone-100 truncate max-w-24">
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
                    className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
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
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
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
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu button (xs only) */}
            {isXs && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="h-8 w-8"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
              {getHeaderTitle()}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <TaskFilters
              value={filterValues}
              onChange={setFilterValues}
              labels={{
                filter: "Filter",
                status: "Status",
                star: "Star",
                date: "Date",
                statusAll: "All",
                statusIncomplete: "Incomplete",
                statusCompleted: "Completed",
                starAll: "All",
                starred: "Starred",
                unstarred: "Unstarred",
                dateAll: "All",
                overdue: "Overdue",
                today: "Today",
                next7Days: "Next 7 Days",
                noDate: "No Date",
                clearFilters: "Clear filters",
              }}
            />
            {/* Select mode button */}
            {isSelectionMode ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExitSelectionMode}
                className="text-blue-600 dark:text-blue-400"
              >
                {selectedCount} selected
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSelectionMode(true)}
              >
                Select
              </Button>
            )}
            <AccountSwitcher onAccountChanged={handleAccountChanged} />
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs bg-stone-200 dark:bg-stone-700 rounded">
                ⌘K
              </kbd>
            </button>
          </div>
        </header>

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
            onDelete={() => setIsBulkDeleteDialogOpen(true)}
            onSetDate={() => setIsBulkDateDialogOpen(true)}
            onCancel={handleExitSelectionMode}
            labels={{
              tasksSelected: "tasks selected",
              selectAll: "Select All",
              deselect: "Deselect",
              complete: "Complete",
              incomplete: "Incomplete",
              star: "Star",
              unstar: "Unstar",
              delete: "Delete",
              setDate: "Set Date",
              cancel: "Cancel",
            }}
          />
        )}

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            {/* New task input */}
            {selectedList && (
              <div className="mb-4">
                {showNewTaskInput ? (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800">
                    <div className="w-5 h-5 rounded-full border border-stone-300 dark:border-stone-600" />
                    <input
                      type="text"
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      placeholder="Enter task name..."
                      className="flex-1 bg-transparent border-none outline-none text-stone-800 dark:text-stone-100 placeholder-stone-400"
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
                      className="p-1.5 rounded-lg bg-stone-900 dark:bg-stone-700 text-white dark:text-stone-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-800 dark:hover:bg-stone-600"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setShowNewTaskInput(false);
                        setNewTaskName("");
                      }}
                      className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700"
                    >
                      <X className="w-4 h-4 text-stone-500" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewTaskInput(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-stone-300 dark:border-stone-600 text-stone-400 hover:border-stone-400 hover:text-stone-600 dark:hover:border-stone-500 dark:hover:text-stone-300 transition-colors"
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
                const listId = selectedList?.id ?? '';
                return (
                  <DndContext
                    sensors={taskSensors}
                    collisionDetection={closestCenter}
                    onDragStart={(e) => handleTaskDragStart(e, null)}
                    onDragEnd={(e) => handleTaskDragEnd(e, listId, null)}
                  >
                    <SortableContext
                      items={displayTasks.map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {displayTasks.map((task) => (
                          <SortableTaskItem
                            key={task.id}
                            task={task}
                            depth={0}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                );
              }

              // Empty state based on view
              return (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-stone-400 dark:text-stone-500" />
                  </div>
                  <h2 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">
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
                  <p className="text-stone-500 dark:text-stone-400 mb-6">
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

      {/* Right Detail Panel - Desktop only (xl screens) */}
      {showDetailPanel && (
        <div className="w-80 flex-shrink-0 transition-all duration-300 ease-in-out border-l border-stone-200 dark:border-stone-800">
          <TaskDetailPanel
            taskId={selectedTaskId}
            onTaskUpdated={() => void fetchTasks()}
            onClose={() => setSelectedTaskId(null)}
          />
        </div>
      )}

      {/* Mobile Task Detail Sheet (sm/md screens) */}
      {!showDetailPanel && (
        <TaskDetailSheet
          taskId={selectedTaskId}
          open={mobileDetailOpen}
          onOpenChange={(open) => {
            setMobileDetailOpen(open);
            if (!open) setSelectedTaskId(null);
          }}
          onTaskUpdated={() => void fetchTasks()}
        />
      )}

      {/* Context Menu for Groups */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-32 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-lg shadow-lg py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => openEditDialog(contextMenu.group)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700"
          >
            <Pencil className="w-4 h-4" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => handleDeleteGroup(contextMenu.group.id)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-stone-100 dark:hover:bg-stone-700"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Context Menu for Lists */}
      {listContextMenu && (
        <div
          className="fixed z-50 min-w-32 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-lg shadow-lg py-1"
          style={{ left: listContextMenu.x, top: listContextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => openEditListDialog(listContextMenu.list)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700"
          >
            <Pencil className="w-4 h-4" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => openMoveListDialog(listContextMenu.list)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700"
          >
            <Move className="w-4 h-4" />
            <span>Move</span>
          </button>
          <button
            onClick={() => handleDeleteList(listContextMenu.list.id)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-stone-100 dark:hover:bg-stone-700"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Context Menu for Tasks */}
      {taskContextMenu && (
        <div
          className="fixed z-50 min-w-32 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-lg shadow-lg py-1"
          style={{ left: taskContextMenu.x, top: taskContextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              startEditTask(taskContextMenu.taskId, taskContextMenu.taskName);
              setTaskContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700"
          >
            <Pencil className="w-4 h-4" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => startAddSubtask(taskContextMenu.taskId)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subtask</span>
          </button>
          <button
            onClick={() => handleDeleteTask(taskContextMenu.taskId)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-stone-100 dark:hover:bg-stone-700"
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
              <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                Group Name
              </label>
              <input
                type="text"
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                placeholder="Enter group name"
                className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdateGroup();
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                Color
              </label>
              <div className="flex items-center gap-2">
                {GROUP_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setEditGroupColor(color.value)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      editGroupColor === color.value ? "ring-2 ring-offset-2 ring-stone-500 scale-110" : ""
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
              <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                List Name
              </label>
              <input
                type="text"
                value={editListName}
                onChange={(e) => setEditListName(e.target.value)}
                placeholder="Enter list name"
                className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400"
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
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Move <strong>{movingList?.name}</strong> to a different group:
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                Target Group
              </label>
              <select
                value={targetGroupId}
                onChange={(e) => setTargetGroupId(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400"
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

      {/* Search Dialog */}
      <Dialog open={showSearch} onOpenChange={setShowSearch}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Search Tasks</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks by name..."
                className="w-full pl-10 pr-4 py-3 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400"
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
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors text-left"
                        >
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                              task.completed
                                ? "border-green-500 bg-green-500 text-white"
                                : "border-stone-300 dark:border-stone-600"
                            }`}
                          >
                            {task.completed && <Check className="w-3 h-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className={`text-sm truncate ${
                                task.completed
                                  ? "line-through text-stone-400"
                                  : "text-stone-900 dark:text-stone-100"
                              }`}
                            >
                              {task.name}
                            </div>
                            <div className="text-xs text-stone-400 truncate">
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
                  <div className="text-center py-8 text-stone-500 dark:text-stone-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No tasks found matching "{searchQuery}"</p>
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-stone-500 dark:text-stone-400">
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

      {/* Bulk Set Date Dialog */}
      <Dialog open={isBulkDateDialogOpen} onOpenChange={setIsBulkDateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Due Date</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Set a due date for {selectedCount} selected task{selectedCount !== 1 ? 's' : ''}.
            </p>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                Due Date
              </label>
              <input
                type="date"
                value={bulkDateValue ? bulkDateValue.toISOString().split('T')[0] : ''}
                onChange={(e) => setBulkDateValue(e.target.value ? new Date(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => {
              setIsBulkDateDialogOpen(false);
              setBulkDateValue(undefined);
            }}>
              Cancel
            </Button>
            <Button onClick={handleBulkSetDate}>
              Set Date
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Tasks</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Are you sure you want to delete {selectedCount} task{selectedCount !== 1 ? 's' : ''}? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsBulkDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DashboardPage;
