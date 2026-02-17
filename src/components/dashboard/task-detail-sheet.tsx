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
import { updateTask, type Task } from "@/actions/tasks";
import { CalendarIcon, Clock, FileText, X } from "lucide-react";
import { format } from "date-fns";

interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: () => void;
}

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  onTaskUpdated,
}: TaskDetailSheetProps) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [planDate, setPlanDate] = useState<Date | undefined>();
  const [comment, setComment] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Load task data when task changes
  useEffect(() => {
    if (task) {
      setName(task.name);
      setDueDate(task.due_date ? new Date(task.due_date) : undefined);
      setPlanDate(task.plan_date ? new Date(task.plan_date) : undefined);
      setComment(task.comment || "");
      setDurationMinutes(task.duration_minutes?.toString() || "");
    }
  }, [task]);

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
    const result = await updateTask(task.id, {
      name: name.trim(),
      due_date: dueDate ? toLocalDateString(dueDate) : null,
      plan_date: planDate ? toLocalDateString(planDate) : null,
      comment: comment.trim() || null,
      duration_minutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
    });

    setIsSaving(false);

    if (result.success) {
      onTaskUpdated();
      onOpenChange(false);
    }
  };

  const clearDueDate = () => setDueDate(undefined);
  const clearPlanDate = () => setPlanDate(undefined);

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("taskDetail.taskDetails")}</SheetTitle>
          <SheetDescription>
            View and edit task information
          </SheetDescription>
        </SheetHeader>

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
      </SheetContent>
    </Sheet>
  );
}
