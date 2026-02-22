import * as React from "react";
import { ChevronLeft, ChevronRight, List } from "lucide-react";
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@puratodo/ui";
import {
  DateCell,
  UnscheduledTaskList,
  type CalendarTask,
} from "@puratodo/task-ui";
import { tasksApi } from "@/lib/api/tasks";
import type { TaskSearchResult } from "@/lib/api/tasks";
import { useDataStore } from "@/stores/dataStore";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useI18n } from "@/i18n";

interface CalendarPanelProps {
  selectedTaskId: string | null;
  onTaskSelect: (taskId: string | null) => void;
}

export function CalendarPanel({
  selectedTaskId,
  onTaskSelect,
}: CalendarPanelProps) {
  const { t } = useI18n();
  const { lists, groups } = useDataStore();
  const breakpoint = useBreakpoint();
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedListId, setSelectedListId] = React.useState<string | null>(null);
  const [tasks, setTasks] = React.useState<CalendarTask[]>([]);
  const [unscheduledTasks, setUnscheduledTasks] = React.useState<CalendarTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = React.useState(false);
  const [isLoadingUnscheduled, setIsLoadingUnscheduled] = React.useState(false);

  // Responsive: Show unscheduled sidebar only on md+ screens
  const showUnscheduledSidebar = breakpoint === "md" || breakpoint === "lg" || breakpoint === "xl";

  // Get current month and year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Navigate to previous month
  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  // Navigate to next month
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Navigate to today
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Load tasks for the current month
  React.useEffect(() => {
    const loadTasks = async () => {
      setIsLoadingTasks(true);
      try {
        // Calculate first and last day of the month
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);

        const startDate = firstDay.toISOString().split("T")[0];
        const endDate = lastDay.toISOString().split("T")[0];

        const result = await tasksApi.getTasksInDateRange(
          startDate,
          endDate,
          selectedListId || undefined
        );

        // Convert TaskSearchResult to CalendarTask
        const calendarTasks: CalendarTask[] = result.map((task) => ({
          id: task.id,
          name: task.name,
          completed: task.completed,
          starred: task.starred,
          plan_date: task.plan_date,
          due_date: task.due_date,
          list_name: task.list_name,
          list_icon: task.list_icon,
          group_name: task.group_name,
          group_color: task.group_color,
        }));

        setTasks(calendarTasks);
      } catch (error) {
        console.error("Failed to load calendar tasks:", error);
        setTasks([]);
      } finally {
        setIsLoadingTasks(false);
      }
    };

    loadTasks();
  }, [currentYear, currentMonth, selectedListId]);

  // Load unscheduled tasks
  React.useEffect(() => {
    const loadUnscheduled = async () => {
      setIsLoadingUnscheduled(true);
      try {
        const result = await tasksApi.getUnscheduledTasks(selectedListId || undefined);

        // Convert TaskSearchResult to CalendarTask
        const calendarTasks: CalendarTask[] = result.map((task) => ({
          id: task.id,
          name: task.name,
          completed: task.completed,
          starred: task.starred,
          plan_date: task.plan_date,
          due_date: task.due_date,
          list_name: task.list_name,
          list_icon: task.list_icon,
          group_name: task.group_name,
          group_color: task.group_color,
        }));

        setUnscheduledTasks(calendarTasks);
      } catch (error) {
        console.error("Failed to load unscheduled tasks:", error);
        setUnscheduledTasks([]);
      } finally {
        setIsLoadingUnscheduled(false);
      }
    };

    loadUnscheduled();
  }, [selectedListId]);

  // Generate calendar grid for the month
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    // Add days from previous month
    const previousMonth = new Date(currentYear, currentMonth, 0);
    const daysInPreviousMonth = previousMonth.getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1, daysInPreviousMonth - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Add days of current month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      days.push({
        date,
        isCurrentMonth: true,
        isToday,
      });
    }

    // Add days from next month to fill the last week
    const remainingDays = 42 - days.length; // 6 weeks * 7 days = 42
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentYear, currentMonth + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return tasks.filter((task) => {
      return task.plan_date === dateStr || task.due_date === dateStr;
    });
  };

  // Month names for display
  const monthNames = [
    t("months.january"), t("months.february"), t("months.march"), t("months.april"),
    t("months.may"), t("months.june"), t("months.july"), t("months.august"),
    t("months.september"), t("months.october"), t("months.november"), t("months.december")
  ];

  // Weekday names for header
  const weekdayNames = [
    t("weekdays.short.sun"), t("weekdays.short.mon"), t("weekdays.short.tue"),
    t("weekdays.short.wed"), t("weekdays.short.thu"), t("weekdays.short.fri"),
    t("weekdays.short.sat")
  ];

  return (
    <div className="flex h-full">
      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold min-w-[200px] text-center">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {/* List Filter Dropdown */}
            <Select
              value={selectedListId || "all"}
              onValueChange={(value) => setSelectedListId(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-[200px]">
                <List className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t("calendar.allLists")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("calendar.allLists")}</SelectItem>
                {groups.map((group) => (
                  <React.Fragment key={group.id}>
                    {lists
                      .filter((list) => list.group_id === group.id)
                      .map((list) => (
                        <SelectItem key={list.id} value={list.id}>
                          {list.icon} {list.name}
                        </SelectItem>
                      ))}
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
            >
              {t("calendar.today")}
            </Button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b">
          {weekdayNames.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid - Responsive minimum height on mobile */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
          {calendarDays.map((day, index) => {
            const dayTasks = getTasksForDate(day.date);
            return (
              <DateCell
                key={index}
                date={day.date}
                isCurrentMonth={day.isCurrentMonth}
                isToday={day.isToday}
                tasks={dayTasks}
                selectedTaskId={selectedTaskId}
                onTaskSelect={onTaskSelect}
              />
            );
          })}
        </div>
      </div>

      {/* Unscheduled Tasks Sidebar - Hidden on mobile (< md) */}
      {showUnscheduledSidebar && (
        <div className="w-80 border-l flex flex-col bg-muted/30">
          <div className="p-4 border-b">
            <h3 className="font-semibold">{t("calendar.unscheduled")}</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <UnscheduledTaskList
              tasks={unscheduledTasks}
              isLoading={isLoadingUnscheduled}
              selectedTaskId={selectedTaskId}
              onTaskSelect={onTaskSelect}
            />
          </div>
        </div>
      )}
    </div>
  );
}
