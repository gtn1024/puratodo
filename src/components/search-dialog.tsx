"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { searchTasks, type TaskSearchResult } from "@/actions/tasks";
import { Check, Circle, Star, Calendar, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskSelect: (taskId: string, listId: string, groupId: string) => void;
}

export function SearchDialog({ open, onOpenChange, onTaskSelect }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TaskSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!open) return;

    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchTasks(query);
        setResults(data);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      }
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, open]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  const handleSelect = useCallback(
    (task: TaskSearchResult) => {
      onTaskSelect(task.id, task.list_id, "");
      onOpenChange(false);
    },
    [onTaskSelect, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Search Tasks</DialogTitle>
        </DialogHeader>
        {/* Search Input */}
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Search className="h-4 w-4 text-stone-400 flex-shrink-0" />
          <Input
            placeholder="Search tasks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 px-0 h-9"
            autoFocus
          />
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-stone-400" />}
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto">
          {query.trim() === "" ? (
            <div className="py-8 text-center text-sm text-stone-500">
              Type to search your tasks
            </div>
          ) : isLoading ? (
            <div className="py-8 text-center text-sm text-stone-500">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-sm text-stone-500">
              No tasks found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <ul className="py-1">
              {results.map((task) => (
                <li
                  key={task.id}
                  onClick={() => handleSelect(task)}
                  className="px-4 py-2 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {/* Completion status */}
                    {task.completed ? (
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-stone-300 dark:text-stone-600 flex-shrink-0" />
                    )}

                    {/* Task name */}
                    <span
                      className={cn(
                        "flex-1 truncate text-sm",
                        task.completed
                          ? "line-through text-stone-400"
                          : "text-stone-900 dark:text-stone-100"
                      )}
                    >
                      {task.name}
                    </span>

                    {/* Star indicator */}
                    {task.starred && (
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
                    )}

                    {/* Due date */}
                    {task.due_date && (
                      <div className="flex items-center gap-1 text-xs text-stone-500">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(task.due_date), "MMM d")}
                      </div>
                    )}
                  </div>

                  {/* Location info */}
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5 pl-6">
                    <span>{task.list_icon}</span>
                    <span className="truncate">{task.list_name}</span>
                    <span className="text-stone-300 dark:text-stone-600">/</span>
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: task.group_color }}
                    />
                    <span className="truncate">{task.group_name}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-2 text-xs text-stone-400 text-center">
          Press <kbd className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 rounded">Esc</kbd> to close
        </div>
      </DialogContent>
    </Dialog>
  );
}
