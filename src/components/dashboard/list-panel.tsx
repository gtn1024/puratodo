"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
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
  reorderLists,
  moveListToGroup,
  type List,
} from "@/actions/lists";
import { MoreHorizontal, Plus, ListTodo, GripVertical, FolderInput } from "lucide-react";
import type { Group } from "@/actions/groups";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ListPanelProps {
  group: Group | null;
  lists: List[];
  allGroups: Group[];
  onListsChange: () => void;
}

export interface ListPanelRef {
  triggerCreateList: () => void;
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

interface SortableListItemProps {
  list: List;
  onEdit: (list: List) => void;
  onDelete: (list: List) => void;
  onMove: (list: List) => void;
}

function SortableListItem({ list, onEdit, onDelete, onMove }: SortableListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: list.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors cursor-pointer group"
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4" />
      </button>

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
          <DropdownMenuItem onClick={() => onEdit(list)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onMove(list)}>
            <FolderInput className="h-4 w-4 mr-2" />
            Move
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(list)}
            className="text-red-600 dark:text-red-400"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

export const ListPanel = forwardRef<ListPanelRef, ListPanelProps>(
  function ListPanel({ group, lists, allGroups, onListsChange }, ref) {
  const [localLists, setLocalLists] = useState(lists);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    triggerCreateList: () => setIsCreateOpen(true),
  }), []);
  const [selectedList, setSelectedList] = useState<List | null>(null);
  const [targetGroupId, setTargetGroupId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync local lists when props change
  useEffect(() => {
    setLocalLists(lists);
  }, [lists]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && group) {
      const oldIndex = localLists.findIndex((l) => l.id === active.id);
      const newIndex = localLists.findIndex((l) => l.id === over.id);
      const newLists = arrayMove(localLists, oldIndex, newIndex);
      setLocalLists(newLists);
      const orderedIds = newLists.map((l) => l.id);
      await reorderLists(group.id, orderedIds);
      onListsChange();
    }
  };

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

  const openMoveDialog = (list: List) => {
    setSelectedList(list);
    setTargetGroupId(null);
    setIsMoveOpen(true);
  };

  const handleMove = async () => {
    if (!selectedList || !targetGroupId) return;
    setIsLoading(true);
    const result = await moveListToGroup(selectedList.id, targetGroupId);
    if (result.success) {
      setIsMoveOpen(false);
      setSelectedList(null);
      setTargetGroupId(null);
      onListsChange();
    }
    setIsLoading(false);
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
          {localLists.length === 0 ? (
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={localLists.map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="grid gap-2">
                  {localLists.map((list) => (
                    <SortableListItem
                      key={list.id}
                      list={list}
                      onEdit={openEditDialog}
                      onDelete={openDeleteDialog}
                      onMove={openMoveDialog}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
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

      {/* Move List Dialog */}
      <Dialog open={isMoveOpen} onOpenChange={setIsMoveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Move List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Move &ldquo;{selectedList?.name}&rdquo; to another group:
            </p>
            <div className="space-y-2">
              {allGroups
                .filter((g) => g.id !== group?.id)
                .map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
                      targetGroupId === g.id
                        ? "border-stone-400 dark:border-stone-500 bg-stone-50 dark:bg-stone-800"
                        : "border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50"
                    }`}
                    onClick={() => setTargetGroupId(g.id)}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: g.color || "#6b7280" }}
                    />
                    <span className="font-medium text-stone-900 dark:text-stone-100">
                      {g.name}
                    </span>
                  </button>
                ))}
              {allGroups.filter((g) => g.id !== group?.id).length === 0 && (
                <p className="text-sm text-stone-400 dark:text-stone-500 text-center py-4">
                  No other groups available
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMoveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMove} disabled={isLoading || !targetGroupId}>
              Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});
