"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createList,
  updateList,
  deleteList,
  type List,
} from "@/actions/lists";
import { MoreHorizontal, Plus, ListTodo, GripVertical } from "lucide-react";
import type { Group } from "@/actions/groups";

interface ListPanelProps {
  group: Group | null;
  lists: List[];
  onListsChange: () => void;
}

// Common emoji icons for lists
const LIST_ICONS = [
  "📋",
  "📝",
  "📌",
  "🎯",
  "💼",
  "🏠",
  "🛒",
  "📚",
  "💡",
  "🎨",
  "🔧",
  "⭐",
];

export function ListPanel({ group, lists, onListsChange }: ListPanelProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<List | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!group || !name.trim()) return;
    setIsLoading(true);
    const result = await createList(group.id, name.trim(), icon || undefined);
    if (result.success) {
      setIsCreateOpen(false);
      setName("");
      setIcon(null);
      onListsChange();
    }
    setIsLoading(false);
  };

  const handleEdit = async () => {
    if (!selectedList || !name.trim()) return;
    setIsLoading(true);
    const result = await updateList(selectedList.id, {
      name: name.trim(),
      icon: icon || undefined,
    });
    if (result.success) {
      setIsEditOpen(false);
      setSelectedList(null);
      setName("");
      setIcon(null);
      onListsChange();
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedList) return;
    setIsLoading(true);
    const result = await deleteList(selectedList.id);
    if (result.success) {
      setIsDeleteOpen(false);
      setSelectedList(null);
      onListsChange();
    }
    setIsLoading(false);
  };

  const openEditDialog = (list: List) => {
    setSelectedList(list);
    setName(list.name);
    setIcon(list.icon);
    setIsEditOpen(true);
  };

  const openDeleteDialog = (list: List) => {
    setSelectedList(list);
    setIsDeleteOpen(true);
  };

  if (!group) {
    return (
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-stone-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
          Welcome to PuraToDo
        </h2>
        <p className="text-stone-500 dark:text-stone-400 mb-6">
          Create a group to get started organizing your tasks
        </p>
        <p className="text-sm text-stone-400 dark:text-stone-500">
          Click the + button in the sidebar to create your first group
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: group.color || "#6b7280" }}
            />
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              {group.name}
            </h2>
            <span className="text-sm text-stone-500 dark:text-stone-400">
              {lists.length} {lists.length === 1 ? "list" : "lists"}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setName("");
              setIcon(null);
              setIsCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add List
          </Button>
        </div>

        {/* List Content */}
        <div className="p-4">
          {lists.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                <ListTodo className="h-6 w-6 text-stone-400" />
              </div>
              <p className="text-stone-500 dark:text-stone-400 mb-4">
                No lists in this group yet
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Create your first list
              </Button>
            </div>
          ) : (
            <ul className="grid gap-2">
              {lists.map((list) => (
                <li
                  key={list.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors cursor-pointer group"
                >
                  <span className="text-xl">{list.icon || "📋"}</span>
                  <span className="flex-1 font-medium text-stone-900 dark:text-stone-100">
                    {list.name}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem onClick={() => openEditDialog(list)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(list)}
                        className="text-red-600 dark:text-red-400"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="List name"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex gap-2 flex-wrap">
                {LIST_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                      icon === emoji
                        ? "bg-stone-200 dark:bg-stone-700 ring-2 ring-stone-400"
                        : "bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700"
                    }`}
                    onClick={() => setIcon(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isLoading || !name.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="List name"
              />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex gap-2 flex-wrap">
                {LIST_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                      icon === emoji
                        ? "bg-stone-200 dark:bg-stone-700 ring-2 ring-stone-400"
                        : "bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700"
                    }`}
                    onClick={() => setIcon(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isLoading || !name.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete List</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Are you sure you want to delete &ldquo;{selectedList?.name}&rdquo;?
            This will also delete all tasks within this list. This action cannot
            be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
