"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ListPanel } from "@/components/dashboard/list-panel";
import { TaskPanel } from "@/components/dashboard/task-panel";
import { LogoutButton } from "./logout-button";
import { getLists, type List } from "@/actions/lists";
import type { Group } from "@/actions/groups";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
    setMobileMenuOpen(false); // Close mobile menu on selection
  };

  const handleGroupSelect = (groupId: string | null) => {
    setSelectedGroupId(groupId);
    // When selecting a group, deselect the list
    if (groupId !== selectedGroupId) {
      setSelectedListId(null);
    }
    setMobileMenuOpen(false); // Close mobile menu on selection
  };

  return (
    <div className="flex h-screen bg-stone-50 dark:bg-stone-950">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar
          initialGroups={initialGroups}
          initialLists={lists}
          selectedGroupId={selectedGroupId}
          selectedListId={selectedListId}
          onGroupSelect={handleGroupSelect}
          onListSelect={handleListSelect}
          onDataChange={handleListsChange}
        />
      </div>

      {/* Mobile Sidebar - Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64" showCloseButton={false}>
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <Sidebar
            initialGroups={initialGroups}
            initialLists={lists}
            selectedGroupId={selectedGroupId}
            selectedListId={selectedListId}
            onGroupSelect={handleGroupSelect}
            onListSelect={handleListSelect}
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

              {selectedList ? (
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
            <LogoutButton />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            {selectedList ? (
              <TaskPanel list={selectedList} />
            ) : (
              <ListPanel
                group={selectedGroup}
                lists={groupLists}
                allGroups={initialGroups}
                onListsChange={handleListsChange}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
