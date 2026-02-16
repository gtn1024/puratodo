"use client";

import { useState, useEffect } from "react";
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
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
  type Task,
} from "@/actions/tasks";
import { MoreHorizontal, Plus, Circle, CheckCircle, Star, GripVertical } from "lucide-react";
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

interface SortableTaskItemProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onToggleStar: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onOpenDetail: (task: Task) => void;
  editingTaskId: string | null;
  editName: string;
  onEditNameChange: (name: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

function SortableTaskItem({
  task,
  onToggleComplete,
  onToggleStar,
  onEdit,
  onDelete,
  onOpenDetail,
  editingTaskId,
  editName,
  onEditNameChange,
  onSaveEdit,
  onCancelEdit,
}: SortableTaskItemProps) {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSaveEdit();
    } else if (e.key === "Escape") {
      onCancelEdit();
    }
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group"
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
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
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem onClick={() => onEdit(task)}>
            Edit
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
        const data = await getTasks(list.id);
        setTasks(data);
      } else {
        setTasks([]);
      }
    }
    loadTasks();
  }, [list]);

  const reloadTasks = async () => {
    if (list) {
      const data = await getTasks(list.id);
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
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
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
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    onToggleComplete={handleToggleComplete}
                    onToggleStar={handleToggleStar}
                    onEdit={handleEdit}
                    onDelete={openDeleteDialog}
                    onOpenDetail={handleOpenDetail}
                    editingTaskId={editingTaskId}
                    editName={editName}
                    onEditNameChange={setEditName}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={handleCancelEdit}
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
            Are you sure you want to delete this task? This action cannot be undone.
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
