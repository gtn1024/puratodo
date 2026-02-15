"use client";

import { useState } from "react";
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
import { createGroup, updateGroup, deleteGroup, reorderGroups, type Group } from "@/actions/groups";
import { MoreHorizontal, Plus, Folder, GripVertical } from "lucide-react";
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

interface SidebarProps {
  initialGroups: Group[];
}

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6b7280", // gray
];

interface SortableGroupItemProps {
  group: Group;
  onEdit: (group: Group) => void;
  onDelete: (group: Group) => void;
}

function SortableGroupItem({ group, onEdit, onDelete }: SortableGroupItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={style}>
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 group cursor-pointer">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{
            backgroundColor: group.color || "#6b7280",
          }}
        />
        <Folder className="h-4 w-4 text-stone-400 flex-shrink-0" />
        <span className="flex-1 text-sm text-stone-700 dark:text-stone-300 truncate">
          {group.name}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={() => onEdit(group)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(group)}
              className="text-red-600 dark:text-red-400"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

export function Sidebar({ initialGroups }: SidebarProps) {
  const [groups, setGroups] = useState(initialGroups);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = groups.findIndex((g) => g.id === active.id);
      const newIndex = groups.findIndex((g) => g.id === over.id);

      const newGroups = arrayMove(groups, oldIndex, newIndex);
      setGroups(newGroups);

      // Persist order to database
      const orderedIds = newGroups.map((g) => g.id);
      await reorderGroups(orderedIds);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsLoading(true);
    const result = await createGroup(name.trim(), color || undefined);
    if (result.success) {
      setIsCreateOpen(false);
      setName("");
      setColor(null);
      // Refresh groups
      window.location.reload();
    }
    setIsLoading(false);
  };

  const handleEdit = async () => {
    if (!selectedGroup || !name.trim()) return;
    setIsLoading(true);
    const result = await updateGroup(selectedGroup.id, {
      name: name.trim(),
      color: color || undefined,
    });
    if (result.success) {
      setIsEditOpen(false);
      setSelectedGroup(null);
      setName("");
      setColor(null);
      window.location.reload();
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedGroup) return;
    setIsLoading(true);
    const result = await deleteGroup(selectedGroup.id);
    if (result.success) {
      setIsDeleteOpen(false);
      setSelectedGroup(null);
      window.location.reload();
    }
    setIsLoading(false);
  };

  const openEditDialog = (group: Group) => {
    setSelectedGroup(group);
    setName(group.name);
    setColor(group.color);
    setIsEditOpen(true);
  };

  const openDeleteDialog = (group: Group) => {
    setSelectedGroup(group);
    setIsDeleteOpen(true);
  };

  return (
    <>
      <aside className="w-64 h-screen bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-stone-800 to-stone-600 dark:from-stone-100 dark:to-stone-300 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-white dark:text-stone-900"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
            <span className="font-semibold text-stone-900 dark:text-stone-100">
              PuraToDo
            </span>
          </div>
        </div>

        {/* Groups Section */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="flex items-center justify-between px-2 py-1.5 mb-1">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Groups
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                setName("");
                setColor(null);
                setIsCreateOpen(true);
              }}
              className="h-5 w-5"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {groups.length === 0 ? (
            <div className="px-2 py-4 text-center">
              <p className="text-sm text-stone-500 dark:text-stone-400">
                No groups yet
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs"
                onClick={() => setIsCreateOpen(true)}
              >
                Create your first group
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={groups.map((g) => g.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-0.5">
                  {groups.map((group) => (
                    <SortableGroupItem
                      key={group.id}
                      group={group}
                      onEdit={openEditDialog}
                      onDelete={openDeleteDialog}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </aside>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Group name"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      color === c
                        ? "border-stone-900 dark:border-stone-100 scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
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
            <DialogTitle>Edit Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Group name"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      color === c
                        ? "border-stone-900 dark:border-stone-100 scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
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
            <DialogTitle>Delete Group</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Are you sure you want to delete &ldquo;{selectedGroup?.name}&rdquo;? This will
            also delete all lists and tasks within this group. This action cannot
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
