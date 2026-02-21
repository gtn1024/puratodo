import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@puratodo/ui";
import { FileText, Loader2 } from "lucide-react";
import { useDataStore } from "@/stores/dataStore";
import {
  TaskDetailForm,
  createRecurrenceEditorValue,
  toLocalDateString,
  type RecurrenceEditorValue,
  type RecurrenceUpdateScope,
} from "@puratodo/task-ui";

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

  // Recurrence and reminder state
  const [recurrence, setRecurrence] = React.useState<RecurrenceEditorValue>(
    createRecurrenceEditorValue()
  );
  const [recurrenceScope, setRecurrenceScope] = React.useState<RecurrenceUpdateScope>("single");
  const [remindAt, setRemindAt] = React.useState<string | null>(null);

  // Load recurrence and remindAt data when taskId changes
  React.useEffect(() => {
    if (!taskId) return;

    const foundTask = tasks.find((t) => t.id === taskId);
    if (foundTask) {
      setRecurrence(
        createRecurrenceEditorValue({
          frequency: (foundTask.recurrence_frequency as any) || "",
          interval: foundTask.recurrence_interval?.toString() || "1",
          weekdays: foundTask.recurrence_weekdays || [],
          endType: foundTask.recurrence_end_date
            ? "onDate"
            : foundTask.recurrence_end_count
            ? "afterCount"
            : "never",
          endDate: foundTask.recurrence_end_date
            ? new Date(foundTask.recurrence_end_date)
            : undefined,
          endCount: foundTask.recurrence_end_count?.toString() || "1",
          rule: foundTask.recurrence_rule || "",
          timezone: foundTask.recurrence_timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        })
      );
      setRemindAt(foundTask.remind_at || null);
    }
  }, [taskId, tasks]);

  const handleSave = async (updates: any) => {
    if (!task) return;

    try {
      await updateTask(task.id, updates);
      onTaskUpdated();
      onClose();
    } catch (err) {
      console.error("Failed to save task:", err);
      throw err;
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
  if (!task) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <TaskDetailForm
      task={task}
      onSave={handleSave}
      onCancel={onClose}
      onClearDueDate={() => {}}
      onClearPlanDate={() => {}}
      recurrence={recurrence}
      onRecurrenceChange={setRecurrence}
      recurrenceScope={recurrenceScope}
      onRecurrenceScopeChange={setRecurrenceScope}
      remindAt={remindAt}
      onRemindAtChange={setRemindAt}
      labels={{
        taskName: "Task Name",
        dueDate: "Due Date",
        planDate: "Planned Date",
        duration: "Duration (minutes)",
        comment: "Notes",
        selectDueDate: "Select due date",
        selectPlanDate: "Select planned date",
        clear: "Clear",
        save: "Save",
        cancel: "Close",
        loading: "Loading...",
        taskNotFound: "Task not found",
      }}
    />
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
