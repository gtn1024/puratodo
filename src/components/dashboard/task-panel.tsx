"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  reorderTasks,
  type Task,
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
} from "lucide-react";
import { TaskDetailSheet } from "./task-detail-sheet";
import type { List } from "@/actions/lists";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  renderSubtasks: (task: Task, level: number) => React.ReactNode;
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
  renderSubtasks,
}: TaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isEditing = editingTaskId === task.id;
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const isExpanded = expandedTasks.has(task.id);

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
        <button
          {...attributes}
          {...listeners}
          style={{ marginLeft: paddingLeft }}
          className="cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-4 w-4" />
        </button>

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
            <DropdownMenuItem onClick={() => onAddSubtask(task)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Subtask
            </DropdownMenuItem>
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
}

export function TaskPanel({ list }: TaskPanelProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskName, setNewTaskName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [addingSubtaskTo, setAddingSubtaskTo] = useState<string | null>(null);
  const [newSubtaskName, setNewSubtaskName] = useState("");

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
      if (list) {
        const data = await getTasksWithSubtasks(list.id);
        setTasks(data);
      } else {
        setTasks([]);
      }
    }
    loadTasks();
  }, [list]);

  const reloadTasks = async () => {
    if (list) {
      const data = await getTasksWithSubtasks(list.id);
      setTasks(data);
    }
  };

  const handleAddTask = async () => {
    if (!list || !newTaskName.trim()) return;
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
    if (!list || !newSubtaskName.trim()) return;
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
    await updateTask(task.id, { completed: !task.completed });
    await reloadTasks();
  };

  const handleToggleStar = async (task: Task) => {
    await updateTask(task.id, { starred: !task.starred });
    await reloadTasks();
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
    setSelectedTask(task);
    setIsDetailOpen(true);
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
    if (over && active.id !== over.id && list) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      setTasks(newTasks);
      const orderedIds = newTasks.map((t) => t.id);
      await reorderTasks(list.id, orderedIds);
    }
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

  const startAddSubtask = (task: Task) => {
    setAddingSubtaskTo(task.id);
    setNewSubtaskName("");
    // Make sure parent is expanded
    if (!expandedTasks.has(task.id)) {
      setExpandedTasks((prev) => new Set(prev).add(task.id));
    }
  };

  const renderSubtasks = useCallback(
    (task: Task, level: number): React.ReactNode => {
      if (!task.subtasks || task.subtasks.length === 0) return null;

      return (
        <SortableContext
          items={task.subtasks.map((t) => t.id)}
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
              renderSubtasks={renderSubtasks}
            />
          ))}
          {/* Add subtask input */}
          {addingSubtaskTo && task.subtasks.some((s) => s.id === addingSubtaskTo)
            ? null
            : null}
        </SortableContext>
      );
    },
    [
      expandedTasks,
      editingTaskId,
      editName,
      addingSubtaskTo,
      handleToggleExpand,
      handleToggleComplete,
      handleToggleStar,
      handleEdit,
      openDeleteDialog,
      handleOpenDetail,
      handleSaveEdit,
      handleCancelEdit,
    ]
  );

  if (!list) {
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

  const totalTasks = countAllTasks(tasks);

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{list.icon || "📋"}</span>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            {list.name}
          </h2>
          <span className="text-sm text-stone-500 dark:text-stone-400">
            {totalTasks} {totalTasks === 1 ? "task" : "tasks"}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Task
        </Button>
      </div>

      {/* Task List */}
      <div className="p-4">
        {/* Add Task Input */}
        {isAdding && (
          <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
            <Circle className="h-5 w-5 text-stone-300" />
            <input
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
        {addingSubtaskTo && (
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
              No tasks in this list yet
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Create your first task
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={tasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-1">
                {tasks.map((task) => (
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
                    renderSubtasks={renderSubtasks}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
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

      {/* Task Detail Sheet */}
      <TaskDetailSheet
        task={selectedTask}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onTaskUpdated={reloadTasks}
      />
    </div>
  );
}
