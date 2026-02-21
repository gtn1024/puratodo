import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@puratodo/ui";
import { CalendarIcon, Clock, FileText, Loader2, Star } from "lucide-react";
import { useDataStore } from "@/stores/dataStore";

interface TaskDetailSheetProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: () => void;
}

function TaskDetailSheetContent({
  taskId,
  onTaskUpdated,
  onClose,
}: {
  taskId: string | null;
  onTaskUpdated: () => void;
  onClose: () => void;
}) {
  const { tasks, updateTask } = useDataStore();

  // Find the task from store
  const task = taskId ? tasks.find((t) => t.id === taskId) : null;

  // Local state for editing
  const [name, setName] = React.useState("");
  const [dueDate, setDueDate] = React.useState<Date | undefined>();
  const [planDate, setPlanDate] = React.useState<Date | undefined>();
  const [comment, setComment] = React.useState("");
  const [durationMinutes, setDurationMinutes] = React.useState<string>("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load task data when taskId changes
  React.useEffect(() => {
    if (!taskId) {
      setIsLoaded(false);
      return;
    }

    const foundTask = tasks.find((t) => t.id === taskId);
    if (foundTask) {
      setName(foundTask.name);
      setDueDate(foundTask.due_date ? new Date(foundTask.due_date) : undefined);
      setPlanDate(foundTask.plan_date ? new Date(foundTask.plan_date) : undefined);
      setComment(foundTask.comment || "");
      setDurationMinutes(foundTask.duration_minutes?.toString() || "");
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [taskId, tasks]);

  // Convert Date to local YYYY-MM-DD string (avoiding timezone issues)
  const toLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSave = async () => {
    if (!task || !name.trim()) return;

    setIsSaving(true);
    try {
      await updateTask(task.id, {
        name: name.trim(),
        due_date: dueDate ? toLocalDateString(dueDate) : null,
        plan_date: planDate ? toLocalDateString(planDate) : null,
        comment: comment.trim() || null,
        duration_minutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
      });
      onTaskUpdated();
    } catch (err) {
      console.error("Failed to save task:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const clearDueDate = () => setDueDate(undefined);
  const clearPlanDate = () => setPlanDate(undefined);

  const toggleStarred = async () => {
    if (!task) return;
    try {
      await updateTask(task.id, { starred: !task.starred });
      onTaskUpdated();
    } catch (err) {
      console.error("Failed to toggle star:", err);
    }
  };

  const toggleCompleted = async () => {
    if (!task) return;
    try {
      await updateTask(task.id, { completed: !task.completed });
      onTaskUpdated();
    } catch (err) {
      console.error("Failed to toggle completion:", err);
    }
  };

  // Empty state - no task selected
  if (!taskId) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-stone-400" />
        </div>
        <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">
          No Task Selected
        </h3>
        <p className="text-sm text-stone-500 dark:text-stone-400 max-w-xs">
          Click on a task to view and edit its details
        </p>
      </div>
    );
  }

  // Loading state
  if (!isLoaded || !task) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Task Name */}
          <div className="space-y-2">
            <label className="font-medium text-stone-700 dark:text-stone-300">
              Task Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter task name"
              className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>

          {/* Completed and Starred Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer hover:border-green-500 ${
                  task.completed
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-stone-300 dark:border-stone-600"
                }`}
                onClick={toggleCompleted}
              >
                {task.completed && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-stone-700 dark:text-stone-300">
                {task.completed ? "Completed" : "Mark complete"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleStarred}
                className={`p-1 rounded ${
                  task.starred ? "text-yellow-500" : "text-stone-300 dark:text-stone-600"
                }`}
              >
                <Star className="w-5 h-5" fill={task.starred ? "currentColor" : "none"} />
              </button>
              <span className="text-sm text-stone-700 dark:text-stone-300">
                {task.starred ? "Starred" : "Star"}
              </span>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 font-medium text-stone-700 dark:text-stone-300">
                <CalendarIcon className="h-4 w-4 text-stone-500 dark:text-stone-400" />
                Due Date
              </label>
              {dueDate && (
                <button
                  onClick={clearDueDate}
                  className="h-6 px-2 text-xs text-stone-500 hover:text-stone-700"
                >
                  Clear
                </button>
              )}
            </div>
            <input
              type="date"
              value={dueDate ? toLocalDateString(dueDate) : ""}
              onChange={(e) => {
                const newDate = e.target.value ? new Date(e.target.value) : undefined;
                setDueDate(newDate);
              }}
              className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Plan Date */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 font-medium text-stone-700 dark:text-stone-300">
                <CalendarIcon className="h-4 w-4 text-stone-500 dark:text-stone-400" />
                Planned Date
              </label>
              {planDate && (
                <button
                  onClick={clearPlanDate}
                  className="h-6 px-2 text-xs text-stone-500 hover:text-stone-700"
                >
                  Clear
                </button>
              )}
            </div>
            <input
              type="date"
              value={planDate ? toLocalDateString(planDate) : ""}
              onChange={(e) => {
                const newDate = e.target.value ? new Date(e.target.value) : undefined;
                setPlanDate(newDate);
              }}
              className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-medium text-stone-700 dark:text-stone-300">
              <Clock className="h-4 w-4 text-stone-500 dark:text-stone-400" />
              Duration (minutes)
            </label>
            <input
              type="number"
              min="0"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="e.g., 30"
              className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-medium text-stone-700 dark:text-stone-300">
              <FileText className="h-4 w-4 text-stone-500 dark:text-stone-400" />
              Notes
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add notes or comments..."
              rows={4}
              className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-stone-200 dark:border-stone-800">
        <div className="flex gap-3">
          <button
            className="flex-1 px-4 py-2 rounded-lg bg-stone-900 dark:bg-stone-700 text-white dark:text-stone-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-800 dark:hover:bg-stone-600"
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button
            className="px-4 py-2 rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 font-medium hover:bg-stone-100 dark:hover:bg-stone-800"
            onClick={onClose}
            disabled={isSaving}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function TaskDetailSheet({
  taskId,
  open,
  onOpenChange,
  onTaskUpdated,
}: TaskDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] rounded-t-xl p-0"
        showCloseButton={false}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Task Details</SheetTitle>
          <SheetDescription>Edit task details</SheetDescription>
        </SheetHeader>
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700" />
        </div>
        <TaskDetailSheetContent
          taskId={taskId}
          onTaskUpdated={onTaskUpdated}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
