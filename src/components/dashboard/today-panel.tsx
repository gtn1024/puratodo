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
  getTodayTasks,
  updateTask,
  deleteTask,
  type TaskSearchResult,
} from "@/actions/tasks";
import {
  MoreHorizontal,
  Circle,
  CheckCircle,
  Star,
  Calendar,
  Sun,
} from "lucide-react";
import { format } from "date-fns";
import { TaskPanelSkeleton } from "./skeletons";
import { TaskDetailSheet } from "./task-detail-sheet";
import { useRealtime } from "@/hooks/use-realtime";

export function TodayPanel() {
  const [tasks, setTasks] = useState<TaskSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskSearchResult | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const reloadTasks = useCallback(async () => {
    const data = await getTodayTasks();
    setTasks(data);
  }, []);

  useEffect(() => {
    async function loadTasks() {
      setIsLoading(true);
      const data = await getTodayTasks();
      setTasks(data);
      setIsLoading(false);
    }
    loadTasks();
  }, []);

  // Realtime subscription for today's tasks
  useRealtime({
    channel: "today-tasks-realtime",
    table: "tasks",
    onInsert: reloadTasks,
    onUpdate: reloadTasks,
    onDelete: reloadTasks,
  });

  const handleToggleComplete = async (task: TaskSearchResult) => {
    // Optimistic update
    const newCompletedState = !task.completed;
    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, completed: newCompletedState } : t
    ));

    try {
      await updateTask(task.id, { completed: newCompletedState });
      reloadTasks();
    } catch (error) {
      // Revert on error
      setTasks(prev => prev.map(t =>
        t.id === task.id ? { ...t, completed: !newCompletedState } : t
      ));
      console.error('Failed to update task:', error);
    }
  };

  const handleToggleStar = async (task: TaskSearchResult) => {
    // Optimistic update
    const newStarredState = !task.starred;
    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, starred: newStarredState } : t
    ));

    try {
      await updateTask(task.id, { starred: newStarredState });
      reloadTasks();
    } catch (error) {
      // Revert on error
      setTasks(prev => prev.map(t =>
        t.id === task.id ? { ...t, starred: !newStarredState } : t
      ));
      console.error('Failed to update task star:', error);
    }
  };

  const handleOpenDetail = (task: TaskSearchResult) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    await reloadTasks();
  };

  // Group tasks by list
  const tasksByList = tasks.reduce((acc, task) => {
    const key = task.list_id;
    if (!acc[key]) {
      acc[key] = {
        list_name: task.list_name,
        list_icon: task.list_icon,
        group_name: task.group_name,
        group_color: task.group_color,
        tasks: [],
      };
    }
    acc[key].tasks.push(task);
    return acc;
  }, {} as Record<string, { list_name: string; list_icon: string; group_name: string; group_color: string; tasks: TaskSearchResult[] }>);

  if (isLoading) {
    return <TaskPanelSkeleton />;
  }

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Sun className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              Today
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {format(new Date(), "EEEE, MMMM d")}
            </p>
          </div>
        </div>
        <span className="text-sm text-stone-500 dark:text-stone-400">
          {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
        </span>
      </div>

      {/* Task List */}
      <div className="p-4">
        {tasks.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-stone-400" />
            </div>
            <p className="text-stone-500 dark:text-stone-400 mb-2">
              No tasks planned for today
            </p>
            <p className="text-sm text-stone-400 dark:text-stone-500">
              Set a plan date on your tasks to see them here
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.values(tasksByList).map((group) => (
              <div key={group.list_name}>
                {/* List Header */}
                <div className="flex items-center gap-2 mb-2 px-2">
                  <span className="text-sm">{group.list_icon}</span>
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                    {group.list_name}
                  </span>
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: group.group_color }}
                  />
                  <span className="text-xs text-stone-500 dark:text-stone-400">
                    {group.group_name}
                  </span>
                </div>

                {/* Tasks */}
                <ul className="space-y-1">
                  {group.tasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group"
                    >
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => handleToggleComplete(task)}
                        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />

                      <span
                        onClick={() => handleOpenDetail(task)}
                        className={`flex-1 cursor-pointer hover:underline ${
                          task.completed
                            ? "text-stone-400 dark:text-stone-500 line-through"
                            : "text-stone-900 dark:text-stone-100"
                        }`}
                      >
                        {task.name}
                      </span>

                      {/* Due date indicator */}
                      {task.due_date && (
                        <div className="flex items-center gap-1 text-xs text-stone-500">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(task.due_date), "MMM d")}
                        </div>
                      )}

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
                          <DropdownMenuItem onClick={() => handleOpenDetail(task)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-600 dark:text-red-400"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Detail Sheet */}
      {selectedTask && (
        <TaskDetailSheet
          task={selectedTask}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          onTaskUpdated={reloadTasks}
        />
      )}
    </div>
  );
}
