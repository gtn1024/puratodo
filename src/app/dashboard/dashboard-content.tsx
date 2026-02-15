"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ListPanel } from "@/components/dashboard/list-panel";
import { LogoutButton } from "./logout-button";
import { getLists, type List } from "@/actions/lists";
import type { Group } from "@/actions/groups";

interface DashboardContentProps {
  initialGroups: Group[];
}

export function DashboardContent({ initialGroups }: DashboardContentProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    initialGroups.length > 0 ? initialGroups[0].id : null
  );
  const [lists, setLists] = useState<List[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const selectedGroup = initialGroups.find((g) => g.id === selectedGroupId) || null;

  useEffect(() => {
    async function loadLists() {
      if (selectedGroupId) {
        const data = await getLists(selectedGroupId);
        setLists(data);
      } else {
        setLists([]);
      }
    }
    loadLists();
  }, [selectedGroupId, refreshKey]);

  const handleListsChange = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="flex h-screen bg-stone-50 dark:bg-stone-950">
      <Sidebar
        initialGroups={initialGroups}
        selectedGroupId={selectedGroupId}
        onGroupSelect={setSelectedGroupId}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              {selectedGroup ? selectedGroup.name : "Dashboard"}
            </h1>
            <LogoutButton />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <ListPanel
              group={selectedGroup}
              lists={lists}
              onListsChange={handleListsChange}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
