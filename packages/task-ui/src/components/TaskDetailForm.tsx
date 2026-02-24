"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Label,
  Textarea,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Calendar,
} from "@puratodo/ui";
import { CalendarIcon, Clock, FileText, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import type { TaskWithSubtasks } from "@puratodo/api-types";

export type RecurrenceFrequency = "" | "daily" | "weekly" | "monthly" | "custom";
export type RecurrenceEndType = "never" | "onDate" | "afterCount";
export type RecurrenceUpdateScope = "single" | "future";

export type RecurrenceEditorValue = {
  frequency: RecurrenceFrequency;
  interval: string;
  weekdays: number[];
  endType: RecurrenceEndType;
  endDate: Date | undefined;
  endCount: string;
  rule: string;
  timezone: string;
};

export interface TaskDetailFormProps {
  task: TaskWithSubtasks | null;
  isLoading?: boolean;
  onSave: (updates: TaskUpdatePayload) => Promise<void>;
  onCancel: () => void;
  onClearDueDate?: () => void;
  onClearPlanDate?: () => void;

  // Recurrence fields
  recurrence: RecurrenceEditorValue;
  onRecurrenceChange: (value: RecurrenceEditorValue) => void;
  recurrenceScope: RecurrenceUpdateScope;
  onRecurrenceScopeChange: (scope: RecurrenceUpdateScope) => void;

  // Reminder fields
  remindAt: string | null;
  onRemindAtChange: (remindAt: string | null) => void;

  // Translations
  labels: {
    taskName: string;
    taskNamePlaceholder: string;
    dueDate: string;
    planDate: string;
    duration: string;
    durationPlaceholder: string;
    comment: string;
    commentPlaceholder: string;
    selectDueDate: string;
    selectPlanDate: string;
    clear: string;
    save: string;
    cancel: string;
    loading: string;
    taskNotFound: string;
  };

  // Recurrence editor component (injected for flexibility)
  RecurrenceEditor?: React.ComponentType<{
    value: RecurrenceEditorValue;
    onChange: (value: RecurrenceEditorValue) => void;
    updateScope: RecurrenceUpdateScope;
    onUpdateScopeChange: (scope: RecurrenceUpdateScope) => void;
  }>;

  // Reminder editor component (injected for flexibility)
  ReminderEditor?: React.ComponentType<{
    remindAt: string | null;
    dueDate: string | null;
    planDate: string | null;
    onChange: (value: { remindAt: string | null }) => void;
  }>;
}

export type TaskUpdatePayload = {
  name: string;
  due_date: string | null;
  plan_date: string | null;
  comment: string | null;
  duration_minutes: number | null;
  recurrence_frequency: string | null;
  recurrence_interval: number | null;
  recurrence_weekdays: number[] | null;
  recurrence_end_date: string | null;
  recurrence_end_count: number | null;
  recurrence_rule: string | null;
  recurrence_timezone: string | null;
  recurrence_update_scope: RecurrenceUpdateScope;
  remind_at: string | null;
};

// Helper to normalize recurrence frequency
function normalizeRecurrenceFrequency(frequency: string | null): RecurrenceFrequency {
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

// Helper to create recurrence editor value from task
export function createRecurrenceEditorValue(task: TaskWithSubtasks): RecurrenceEditorValue {
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

// Convert Date to local YYYY-MM-DD string (avoiding timezone issues)
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function TaskDetailForm({
  task,
  isLoading = false,
  onSave,
  onCancel,
  recurrence,
  onRecurrenceChange,
  recurrenceScope,
  onRecurrenceScopeChange,
  remindAt,
  onRemindAtChange,
  labels,
  RecurrenceEditor,
  ReminderEditor,
}: TaskDetailFormProps) {
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [planDate, setPlanDate] = useState<Date | undefined>();
  const [comment, setComment] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when task changes
  useEffect(() => {
    if (task) {
      setName(task.name);
      setDueDate(task.due_date ? new Date(task.due_date) : undefined);
      setPlanDate(task.plan_date ? new Date(task.plan_date) : undefined);
      setComment(task.comment || "");
      setDurationMinutes(task.duration_minutes?.toString() || "");
    }
  }, [task]);

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

    const updates: TaskUpdatePayload = {
      name: name.trim(),
      due_date: dueDate ? toLocalDateString(dueDate) : null,
      plan_date: planDate ? toLocalDateString(planDate) : null,
      comment: comment.trim() || null,
      duration_minutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
      ...recurrencePayload,
      recurrence_update_scope: recurrenceScope,
      remind_at: remindAt,
    };

    try {
      await onSave(updates);
    } finally {
      setIsSaving(false);
    }
  };

  const clearDueDate = () => setDueDate(undefined);
  const clearPlanDate = () => setPlanDate(undefined);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <X className="h-8 w-8 text-stone-400 mb-4" />
        <p className="text-stone-500">{labels.taskNotFound}</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6 px-4 pb-4">
      {/* Task Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="font-medium text-stone-700 dark:text-stone-300">
          {labels.taskName}
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          placeholder={labels.taskNamePlaceholder}
        />
      </div>

      {/* Due Date */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 font-medium text-stone-700 dark:text-stone-300">
            <CalendarIcon className="h-4 w-4 text-stone-500 dark:text-stone-400" />
            {labels.dueDate}
          </Label>
          {dueDate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDueDate}
              className="h-6 px-2 text-stone-500"
            >
              <X className="h-3 w-3 mr-1" />
              {labels.clear}
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
              {dueDate ? format(dueDate, "PPP") : labels.selectDueDate}
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
            {labels.planDate}
          </Label>
          {planDate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearPlanDate}
              className="h-6 px-2 text-stone-500"
            >
              <X className="h-3 w-3 mr-1" />
              {labels.clear}
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
              {planDate ? format(planDate, "PPP") : labels.selectPlanDate}
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
        <Label
          htmlFor="duration"
          className="flex items-center gap-2 font-medium text-stone-700 dark:text-stone-300"
        >
          <Clock className="h-4 w-4 text-stone-500 dark:text-stone-400" />
          {labels.duration}
        </Label>
        <Input
          id="duration"
          type="number"
          min="0"
          value={durationMinutes}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDurationMinutes(e.target.value)}
          placeholder={labels.durationPlaceholder}
        />
      </div>

      {/* Recurrence Editor (injected) */}
      {RecurrenceEditor && (
        <RecurrenceEditor
          value={recurrence}
          onChange={onRecurrenceChange}
          updateScope={recurrenceScope}
          onUpdateScopeChange={onRecurrenceScopeChange}
        />
      )}

      {/* Reminder Editor (injected) */}
      {ReminderEditor && (
        <ReminderEditor
          remindAt={remindAt}
          dueDate={dueDate ? toLocalDateString(dueDate) : null}
          planDate={planDate ? toLocalDateString(planDate) : null}
          onChange={({ remindAt: newRemindAt }) => onRemindAtChange(newRemindAt)}
        />
      )}

      {/* Comment */}
      <div className="space-y-2">
        <Label
          htmlFor="comment"
          className="flex items-center gap-2 font-medium text-stone-700 dark:text-stone-300"
        >
          <FileText className="h-4 w-4 text-stone-500 dark:text-stone-400" />
          {labels.comment}
        </Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
          placeholder={labels.commentPlaceholder}
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
          {isSaving ? labels.loading : labels.save}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          {labels.cancel}
        </Button>
      </div>
    </div>
  );
}
