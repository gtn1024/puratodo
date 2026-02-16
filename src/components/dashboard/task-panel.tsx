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
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  type Task,
} from "@/actions/tasks";
import { MoreHorizontal, Plus, Circle, CheckCircle, Star } from "lucide-react";
import type { List } from "@/actions/lists";

interface TaskPanelProps {
  list: List | null;
}

export function TaskPanel({ list }: TaskPanelProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskName, setNewTaskName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleAddTask = async () => {
    if (!list || !newTaskName.trim()) return;
    setIsLoading(true);
    const result = await createTask(list.id, newTaskName.trim());
    if (result.success) {
      setNewTaskName("");
      setIsAdding(false);
      // Reload tasks
      const data = await getTasks(list.id);
      setTasks(data);
    }
    setIsLoading(false);
  };

  const handleToggleComplete = async (task: Task) => {
    await updateTask(task.id, { completed: !task.completed });
    const data = await getTasks(list!.id);
    setTasks(data);
  };

  const handleToggleStar = async (task: Task) => {
    await updateTask(task.id, { starred: !task.starred });
    const data = await getTasks(list!.id);
    setTasks(data);
  };

  const handleDelete = async (task: Task) => {
    await deleteTask(task.id);
    const data = await getTasks(list!.id);
    setTasks(data);
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
          <ul className="space-y-1">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group"
              >
                {/* Checkbox */}
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => handleToggleComplete(task)}
                  className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                />

                {/* Task Name */}
                <span
                  className={`flex-1 ${
                    task.completed
                      ? "text-stone-400 dark:text-stone-500 line-through"
                      : "text-stone-900 dark:text-stone-100"
                  }`}
                >
                  {task.name}
                </span>

                {/* Star Button */}
                <button
                  onClick={() => handleToggleStar(task)}
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
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(task)}
                      className="text-red-600 dark:text-red-400"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
