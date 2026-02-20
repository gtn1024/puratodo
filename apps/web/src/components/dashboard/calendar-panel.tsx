"use client";

import { useState, useMemo } from "react";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Star,
} from "lucide-react";
import type { TaskSearchResult } from "@/actions/tasks";
import type { List } from "@/actions/lists";

interface CalendarPanelProps {
  selectedTaskId: string | null;
  allLists: List[];
  filterListId?: string | null;
  onTaskSelect: (taskId: string | null) => void;
  onFilterChange?: (listId: string | null) => void;
}

interface TaskChipProps {
  task: TaskSearchResult;
  isSelected: boolean;
  onSelect: () => void;
}

function TaskChip({ task, isSelected, onSelect }: TaskChipProps) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`group flex items-center gap-1 px-1.5 py-0.5 rounded text-xs cursor-pointer transition-colors ${
        isSelected
          ? "bg-violet-200 dark:bg-violet-800"
          : "hover:bg-stone-100 dark:hover:bg-stone-800"
      } ${task.completed ? "opacity-60" : ""}`}
    >
      {task.completed ? (
        <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
      ) : task.starred ? (
        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
      ) : (
        <Circle className="h-3 w-3 text-stone-400 flex-shrink-0" />
      )}
      <span className={`truncate ${task.completed ? "line-through" : ""}`}>
        {task.name}
      </span>
    </div>
  );
}

interface DateCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: TaskSearchResult[];
  selectedTaskId: string | null;
  onTaskSelect: (taskId: string) => void;
}

function DateCell({
  date,
  isCurrentMonth,
  isToday,
  tasks,
  selectedTaskId,
  onTaskSelect,
}: DateCellProps) {
  const displayTasks = tasks.slice(0, 3);
  const remainingCount = tasks.length - 3;

  return (
    <div
      className={`min-h-[80px] md:min-h-[100px] border border-stone-200 dark:border-stone-700 p-1 transition-colors ${
        isCurrentMonth
          ? "bg-white dark:bg-stone-900"
          : "bg-stone-50 dark:bg-stone-950"
      } ${isToday ? "ring-2 ring-inset ring-violet-400" : ""}`}
    >
      <div
        className={`text-xs font-medium mb-1 ${
          isToday
            ? "text-violet-600 dark:text-violet-400"
            : isCurrentMonth
            ? "text-stone-700 dark:text-stone-300"
            : "text-stone-400 dark:text-stone-600"
        }`}
      >
        {date.getDate()}
      </div>
      <div className="space-y-0.5">
        {displayTasks.map((task) => (
          <TaskChip
            key={task.id}
            task={task}
            isSelected={selectedTaskId === task.id}
            onSelect={() => onTaskSelect(task.id)}
          />
        ))}
        {remainingCount > 0 && (
          <div className="text-[10px] text-stone-500 dark:text-stone-400 px-1.5">
            +{remainingCount} more
          </div>
        )}
      </div>
    </div>
  );
}

export function CalendarPanel({
  selectedTaskId,
  allLists,
  onTaskSelect,
}: CalendarPanelProps) {
  const { t } = useI18n();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  // Get first day of month
  const firstDayOfMonth = useMemo(() => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  }, [currentDate]);

  // Calendar grid - start from Sunday of the first week
  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    const startDay = firstDayOfMonth.getDay();
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDay);

    // 6 weeks (42 days)
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  }, [firstDayOfMonth]);

  // Navigation
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  // Check if date is in current month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setSelectedFilter(value);
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="h-full flex flex-col md:flex-row gap-4">
      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col">
        {/* Header with navigation and filter */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToToday}>
              {t("calendar.today")}
            </Button>
            <h2 className="text-lg font-semibold ml-2">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
          </div>
          <Select value={selectedFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("calendar.allLists")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("calendar.allLists")}</SelectItem>
              {allLists.map((list) => (
                <SelectItem key={list.id} value={list.id}>
                  <span className="flex items-center gap-2">
                    <span>{list.icon || "📋"}</span>
                    <span>{list.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-stone-200 dark:border-stone-700">
          {weekDayNames.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-medium text-stone-500 dark:text-stone-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 flex-1">
          {calendarDays.map((date, index) => (
            <DateCell
              key={index}
              date={date}
              isCurrentMonth={isCurrentMonth(date)}
              isToday={isToday(date)}
              tasks={[]}
              selectedTaskId={selectedTaskId}
              onTaskSelect={onTaskSelect}
            />
          ))}
        </div>
      </div>

      {/* Unscheduled tasks sidebar - hidden on mobile */}
      <div className="hidden md:block w-64 flex-shrink-0 border-l border-stone-200 dark:border-stone-700 pl-4">
        <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
          {t("calendar.unscheduled")}
        </h3>
        <div className="h-[calc(100vh-280px)] overflow-y-auto">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {t("calendar.noTasks")}
          </p>
        </div>
      </div>
    </div>
  );
}
