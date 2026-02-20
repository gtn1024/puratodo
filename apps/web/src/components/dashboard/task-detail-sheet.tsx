"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { getTaskById, updateTask, type Task } from "@/actions/tasks";
import {
  RecurrenceFields,
  type RecurrenceEditorValue,
  type RecurrenceFrequency,
  type RecurrenceUpdateScope,
} from "@/components/dashboard/recurrence-fields";
import { ReminderFields } from "@/components/dashboard/reminder-fields";
import { CalendarIcon, Clock, FileText, X, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface TaskDetailSheetProps {
  task: Task | null;
  taskId?: string | null; // Alternative: pass just the ID
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: () => void;
}

function normalizeRecurrenceFrequency(
  frequency: string | null
): RecurrenceFrequency {
  if (
    frequency === "daily" ||
    frequency === "weekly" ||
    frequency === "monthly" ||
    frequency === "custom"
  ) {
    return frequency;
  }
  return "";
}

function createRecurrenceEditorValue(task: Task): RecurrenceEditorValue {
  const frequency = normalizeRecurrenceFrequency(task.recurrence_frequency);
  const fallbackTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  return {
    frequency,
    interval: task.recurrence_interval?.toString() || (frequency ? "1" : ""),
    weekdays: task.recurrence_weekdays || [],
    endType: task.recurrence_end_date
      ? "onDate"
      : task.recurrence_end_count
        ? "afterCount"
        : "never",
    endDate: task.recurrence_end_date
      ? new Date(task.recurrence_end_date)
      : undefined,
    endCount: task.recurrence_end_count?.toString() || "",
    rule: task.recurrence_rule || "",
    timezone: task.recurrence_timezone || (frequency ? fallbackTimezone : ""),
  };
}

export function TaskDetailSheet({
  task: initialTask,
  taskId,
  open,
  onOpenChange,
  onTaskUpdated,
}: TaskDetailSheetProps) {
  const { t } = useI18n();
  const [task, setTask] = useState<Task | null>(initialTask);
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [planDate, setPlanDate] = useState<Date | undefined>();
  const [comment, setComment] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<string>("");
  const [recurrence, setRecurrence] = useState<RecurrenceEditorValue>({
    frequency: "",
    interval: "",
    weekdays: [],
    endType: "never",
    endDate: undefined,
    endCount: "",
    rule: "",
    timezone: "",
  });
  const [recurrenceScope, setRecurrenceScope] =
    useState<RecurrenceUpdateScope>("single");
  const [remindAt, setRemindAt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load task data when task changes
  useEffect(() => {
    async function loadTask() {
      // If we have a taskId but no task, or the task id doesn't match, load it
      const effectiveTaskId = taskId || initialTask?.id;

      if (effectiveTaskId && (!initialTask || initialTask.id !== effectiveTaskId)) {
        setIsLoading(true);
        const loadedTask = await getTaskById(effectiveTaskId);
        setTask(loadedTask);
        if (loadedTask) {
          setName(loadedTask.name);
          setDueDate(loadedTask.due_date ? new Date(loadedTask.due_date) : undefined);
          setPlanDate(loadedTask.plan_date ? new Date(loadedTask.plan_date) : undefined);
          setComment(loadedTask.comment || "");
          setDurationMinutes(loadedTask.duration_minutes?.toString() || "");
          setRecurrence(createRecurrenceEditorValue(loadedTask));
          setRecurrenceScope("single");
          setRemindAt(loadedTask.remind_at);
        }
        setIsLoading(false);
      } else if (initialTask) {
        setTask(initialTask);
        setName(initialTask.name);
        setDueDate(initialTask.due_date ? new Date(initialTask.due_date) : undefined);
        setPlanDate(initialTask.plan_date ? new Date(initialTask.plan_date) : undefined);
        setComment(initialTask.comment || "");
        setDurationMinutes(initialTask.duration_minutes?.toString() || "");
        setRecurrence(createRecurrenceEditorValue(initialTask));
        setRecurrenceScope("single");
        setRemindAt(initialTask.remind_at);
      }
    }

    if (open) {
      loadTask();
    }
  }, [initialTask, taskId, open]);

  // Convert Date to local YYYY-MM-DD string (avoiding timezone issues)
  const toLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSave = async () => {
    if (!task || !name.trim()) return;

    const fallbackTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const parsedInterval = parseInt(recurrence.interval, 10);
    const parsedEndCount = parseInt(recurrence.endCount, 10);

    const recurrencePayload = recurrence.frequency
      ? {
          recurrence_frequency: recurrence.frequency,
          recurrence_interval:
            Number.isInteger(parsedInterval) && parsedInterval > 0
              ? parsedInterval
              : 1,
          recurrence_weekdays:
            recurrence.frequency === "weekly" || recurrence.frequency === "custom"
              ? recurrence.weekdays.length > 0
                ? Array.from(new Set(recurrence.weekdays)).sort((a, b) => a - b)
                : null
              : null,
          recurrence_end_date:
            recurrence.endType === "onDate" && recurrence.endDate
              ? toLocalDateString(recurrence.endDate)
              : null,
          recurrence_end_count:
            recurrence.endType === "afterCount" &&
            Number.isInteger(parsedEndCount) &&
            parsedEndCount > 0
              ? parsedEndCount
              : null,
          recurrence_rule:
            recurrence.frequency === "custom"
              ? recurrence.rule.trim() || null
              : null,
          recurrence_timezone:
            recurrence.timezone.trim() || fallbackTimezone || null,
        }
      : {
          recurrence_frequency: null,
          recurrence_interval: null,
          recurrence_weekdays: null,
          recurrence_end_date: null,
          recurrence_end_count: null,
          recurrence_rule: null,
          recurrence_timezone: null,
        };

    setIsSaving(true);
    const result = await updateTask(task.id, {
      name: name.trim(),
      due_date: dueDate ? toLocalDateString(dueDate) : null,
      plan_date: planDate ? toLocalDateString(planDate) : null,
      comment: comment.trim() || null,
      duration_minutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
      ...recurrencePayload,
      recurrence_update_scope: recurrenceScope,
      remind_at: remindAt,
    });

    setIsSaving(false);

    if (result.success) {
      onTaskUpdated();
      onOpenChange(false);
    }
  };

  const clearDueDate = () => setDueDate(undefined);
  const clearPlanDate = () => setPlanDate(undefined);

  const effectiveTaskId = taskId || initialTask?.id;
  if (!effectiveTaskId) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[85%] sm:w-[400px] md:w-[500px] lg:w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("taskDetail.taskDetails")}</SheetTitle>
          <SheetDescription>
            View and edit task information
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
          </div>
        ) : !task ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <X className="h-8 w-8 text-stone-400 mb-4" />
            <p className="text-stone-500">Task not found</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6 px-4 pb-4">
            {/* Task Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="font-medium text-stone-700 dark:text-stone-300">Task Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter task name"
              />
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 font-medium text-stone-700 dark:text-stone-300">
                  <CalendarIcon className="h-4 w-4 text-stone-500 dark:text-stone-400" />
                  {t("taskDetail.dueDate")}
                </Label>
                {dueDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearDueDate}
                    className="h-6 px-2 text-stone-500"
                  >
                    <X className="h-3 w-3 mr-1" />
                    {t("taskDetail.clear")}
                  </Button>
                )}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      !dueDate ? "text-stone-500" : ""
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : t("taskDetail.selectDueDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Plan Date */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 font-medium text-stone-700 dark:text-stone-300">
                  <CalendarIcon className="h-4 w-4 text-stone-500 dark:text-stone-400" />
                  {t("taskDetail.planDate")}
                </Label>
                {planDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearPlanDate}
                    className="h-6 px-2 text-stone-500"
                  >
                    <X className="h-3 w-3 mr-1" />
                    {t("taskDetail.clear")}
                  </Button>
                )}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      !planDate ? "text-stone-500" : ""
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {planDate ? format(planDate, "PPP") : t("taskDetail.selectPlanDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={planDate}
                    onSelect={setPlanDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration" className="flex items-center gap-2 font-medium text-stone-700 dark:text-stone-300">
                <Clock className="h-4 w-4 text-stone-500 dark:text-stone-400" />
                {t("taskDetail.duration")}
              </Label>
              <Input
                id="duration"
                type="number"
                min="0"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="e.g., 30"
              />
            </div>

            {/* Recurrence */}
            <RecurrenceFields
              value={recurrence}
              onChange={setRecurrence}
              updateScope={recurrenceScope}
              onUpdateScopeChange={setRecurrenceScope}
            />

            {/* Reminder */}
            <ReminderFields
              remindAt={remindAt}
              dueDate={dueDate ? toLocalDateString(dueDate) : null}
              planDate={planDate ? toLocalDateString(planDate) : null}
              onChange={({ remindAt: newRemindAt }) => setRemindAt(newRemindAt)}
            />

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="comment" className="flex items-center gap-2 font-medium text-stone-700 dark:text-stone-300">
                <FileText className="h-4 w-4 text-stone-500 dark:text-stone-400" />
                {t("taskDetail.comment")}
              </Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add notes or comments..."
                rows={4}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={isSaving || !name.trim()}
              >
                {isSaving ? t("common.loading") : t("common.save")}
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
