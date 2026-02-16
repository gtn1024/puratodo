"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ListPanel } from "@/components/dashboard/list-panel";
import { TaskPanel } from "@/components/dashboard/task-panel";
import { TodayPanel } from "@/components/dashboard/today-panel";
import { LogoutButton } from "./logout-button";
import { getLists, type List } from "@/actions/lists";
import type { Group } from "@/actions/groups";
import { Menu, Search, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  KeyboardShortcutsDialog,
  KeyboardShortcutsButton,
} from "@/components/keyboard-shortcuts-dialog";
import { SearchDialog } from "@/components/search-dialog";
import { useKeyboardShortcuts, type KeyboardShortcut } from "@/hooks/use-keyboard-shortcuts";
import { useRealtime } from "@/hooks/use-realtime";

interface DashboardContentProps {
  initialGroups: Group[];
  allLists: List[];
}

export function DashboardContent({ initialGroups, allLists }: DashboardContentProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    initialGroups.length > 0 ? initialGroups[0].id : null
  );
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [lists, setLists] = useState<List[]>(allLists);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [showTodayView, setShowTodayView] = useState(false);

  // Refs for triggering creation in child components
  const listPanelRef = useRef<{ triggerCreateList: () => void }>(null);
  const taskPanelRef = useRef<{ triggerCreateTask: () => void }>(null);

  const selectedGroup = initialGroups.find((g) => g.id === selectedGroupId) || null;
  const selectedList = lists.find((l) => l.id === selectedListId) || null;

  // Filter lists for the selected group
  const groupLists = selectedGroupId
    ? lists.filter((l) => l.group_id === selectedGroupId)
    : [];

  useEffect(() => {
    async function loadLists() {
      const data = await getLists();
      setLists(data);
    }
    if (refreshKey > 0) {
      loadLists();
    }
  }, [refreshKey]);

  const handleListsChange = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleListSelect = (listId: string | null, groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedListId(listId);
    setShowTodayView(false); // Exit today view when selecting list
    setMobileMenuOpen(false); // Close mobile menu on selection
  };

  const handleGroupSelect = (groupId: string | null) => {
    setSelectedGroupId(groupId);
    // When selecting a group, deselect the list
    if (groupId !== selectedGroupId) {
      setSelectedListId(null);
    }
    setShowTodayView(false); // Exit today view when selecting group
    setMobileMenuOpen(false); // Close mobile menu on selection
  };

  const handleTodaySelect = () => {
    setShowTodayView(true);
    setSelectedGroupId(null);
    setSelectedListId(null);
    setMobileMenuOpen(false);
  };

  // Handle task selection from search
  const handleTaskSelect = useCallback((taskId: string, listId: string, _groupId: string) => {
    const list = lists.find((l) => l.id === listId);
    if (list) {
      setSelectedGroupId(list.group_id);
      setSelectedListId(listId);
      setShowTodayView(false);
    }
  }, [lists]);

  // Keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    {
      key: "n",
      action: useCallback(() => {
        if (selectedList) {
          taskPanelRef.current?.triggerCreateTask();
        } else if (selectedGroup) {
          listPanelRef.current?.triggerCreateList();
        }
      }, [selectedList, selectedGroup]),
      description: "New task/list",
    },
    {
      key: "l",
      action: useCallback(() => {
        if (selectedGroup && !selectedList) {
          listPanelRef.current?.triggerCreateList();
        }
      }, [selectedGroup, selectedList]),
      description: "New list",
    },
    {
      key: "?",
      action: useCallback(() => {
        setShortcutsDialogOpen(true);
      }, []),
      description: "Show shortcuts",
    },
    {
      key: "Escape",
      action: useCallback(() => {
        if (searchDialogOpen) {
          setSearchDialogOpen(false);
        } else if (mobileMenuOpen) {
          setMobileMenuOpen(false);
        } else if (shortcutsDialogOpen) {
          setShortcutsDialogOpen(false);
        }
      }, [searchDialogOpen, mobileMenuOpen, shortcutsDialogOpen]),
      description: "Close dialog",
    },
  ];

  // Ctrl/Cmd + K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchDialogOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useKeyboardShortcuts({ shortcuts });

  // Realtime subscriptions
  const handleRealtimeChange = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useRealtime({
    channel: "groups-realtime",
    table: "groups",
    onInsert: handleRealtimeChange,
    onUpdate: handleRealtimeChange,
    onDelete: handleRealtimeChange,
  });

  useRealtime({
    channel: "lists-realtime",
    table: "lists",
    onInsert: handleRealtimeChange,
    onUpdate: handleRealtimeChange,
    onDelete: handleRealtimeChange,
  });

  return (
    <div className="flex h-screen bg-stone-50 dark:bg-stone-950">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar
          initialGroups={initialGroups}
          initialLists={lists}
          selectedGroupId={selectedGroupId}
          selectedListId={selectedListId}
          showTodayView={showTodayView}
          onGroupSelect={handleGroupSelect}
          onListSelect={handleListSelect}
          onTodaySelect={handleTodaySelect}
          onDataChange={handleListsChange}
        />
      </div>

      {/* Mobile Sidebar - Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64" showCloseButton={false}>
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>Navigate between groups and lists</SheetDescription>
          </SheetHeader>
          <Sidebar
            initialGroups={initialGroups}
            initialLists={lists}
            selectedGroupId={selectedGroupId}
            selectedListId={selectedListId}
            showTodayView={showTodayView}
            onGroupSelect={handleGroupSelect}
            onListSelect={handleListSelect}
            onTodaySelect={handleTodaySelect}
            onDataChange={handleListsChange}
          />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-8 w-8 mr-1"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>

              {showTodayView ? (
                <>
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Sun className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                    Today
                  </h1>
                </>
              ) : selectedList ? (
                <>
                  <span className="text-xl">{selectedList.icon || "📋"}</span>
                  <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                    {selectedList.name}
                  </h1>
                </>
              ) : selectedGroup ? (
                <>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedGroup.color || "#6b7280" }}
                  />
                  <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                    {selectedGroup.name}
                  </h1>
                </>
              ) : (
                <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                  Dashboard
                </h1>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchDialogOpen(true)}
                className="h-7 px-2 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
              >
                <Search className="h-3.5 w-3.5 mr-1.5" />
                <span className="hidden sm:inline text-xs">Search</span>
                <kbd className="hidden sm:inline ml-1.5 px-1.5 py-0.5 text-[10px] bg-stone-100 dark:bg-stone-800 rounded">
                  {typeof navigator !== "undefined" && navigator.platform.includes("Mac") ? "⌘" : "Ctrl"}K
                </kbd>
              </Button>
              <KeyboardShortcutsButton onClick={() => setShortcutsDialogOpen(true)} />
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            {showTodayView ? (
              <TodayPanel />
            ) : selectedList ? (
              <TaskPanel ref={taskPanelRef} list={selectedList} />
            ) : (
              <ListPanel
                ref={listPanelRef}
                group={selectedGroup}
                lists={groupLists}
                allGroups={initialGroups}
                onListsChange={handleListsChange}
              />
            )}
          </div>
        </main>
      </div>

      {/* Keyboard Shortcuts Help Dialog */}
      <KeyboardShortcutsDialog
        open={shortcutsDialogOpen}
        onOpenChange={setShortcutsDialogOpen}
      />

      {/* Search Dialog */}
      <SearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        onTaskSelect={handleTaskSelect}
      />
    </div>
  );
}
