import * as React from "react";
import {
  LogOut,
  CheckCircle2,
  Plus,
  Folder,
  List,
  Star,
  ChevronDown,
  X,
  Check,
  Pencil,
  Trash2,
  Settings,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ApiServerSettingsDialog } from "@/components/ApiServerSettingsDialog";
import { AccountSettingsDialog } from "@/components/AccountSettingsDialog";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/authStore";
import { useDataStore } from "@/stores/dataStore";
import type { List as ListType } from "@/lib/api/lists";
import type { Group } from "@/lib/api/groups";

// Color options for groups
const GROUP_COLORS = [
  { name: "Violet", value: "#8b5cf6" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Orange", value: "#f97316" },
  { name: "Red", value: "#ef4444" },
  { name: "Pink", value: "#ec4899" },
  { name: "Cyan", value: "#06b6d4" },
];

export function DashboardPage() {
  const { logout } = useAuth();
  const { user, activeAccountId } = useAuthStore();
  const {
    groups,
    lists,
    tasks,
    isLoading,
    error,
    fetchAll,
    fetchTasks,
    createGroup,
    updateGroup,
    reorderGroups,
    deleteGroup,
    clear,
  } = useDataStore();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = React.useState(false);
  const [selectedListId, setSelectedListId] = React.useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());
  const [showNewGroupInput, setShowNewGroupInput] = React.useState(false);
  const [newGroupName, setNewGroupName] = React.useState("");
  const [newGroupColor, setNewGroupColor] = React.useState(GROUP_COLORS[0].value);
  const [isCreatingGroup, setIsCreatingGroup] = React.useState(false);

  // Edit group state
  const [editingGroup, setEditingGroup] = React.useState<Group | null>(null);
  const [editGroupName, setEditGroupName] = React.useState("");
  const [editGroupColor, setEditGroupColor] = React.useState("");
  const [isUpdatingGroup, setIsUpdatingGroup] = React.useState(false);
  const [draggingGroupId, setDraggingGroupId] = React.useState<string | null>(null);
  const [dropTargetGroupId, setDropTargetGroupId] = React.useState<string | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
    group: Group;
  } | null>(null);

  // Refetch data when active account changes
  React.useEffect(() => {
    if (!activeAccountId) return;
    clear();
    setSelectedListId(null);
    void fetchAll();
  }, [activeAccountId, clear, fetchAll]);

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // Get lists for a group
  const getListsForGroup = (groupId: string): ListType[] => {
    return lists.filter((list) => list.group_id === groupId);
  };

  // Handle creating new group
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    setIsCreatingGroup(true);
    try {
      await createGroup({
        name: newGroupName.trim(),
        color: newGroupColor,
      });
      setNewGroupName("");
      setNewGroupColor(GROUP_COLORS[0].value);
      setShowNewGroupInput(false);
    } catch (err) {
      console.error("Failed to create group:", err);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  // Handle deleting a group
  const handleDeleteGroup = async (groupId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setContextMenu(null);
    if (!confirm("Delete this group and all its lists?")) return;

    try {
      await deleteGroup(groupId);
    } catch (err) {
      console.error("Failed to delete group:", err);
    }
  };

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent, group: Group) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, group });
  };

  // Open edit dialog
  const openEditDialog = (group: Group) => {
    setContextMenu(null);
    setEditingGroup(group);
    setEditGroupName(group.name);
    setEditGroupColor(group.color || GROUP_COLORS[0].value);
  };

  // Handle update group
  const handleUpdateGroup = async () => {
    if (!editingGroup || !editGroupName.trim()) return;

    setIsUpdatingGroup(true);
    try {
      await updateGroup(editingGroup.id, {
        name: editGroupName.trim(),
        color: editGroupColor,
      });
      setEditingGroup(null);
    } catch (err) {
      console.error("Failed to update group:", err);
    } finally {
      setIsUpdatingGroup(false);
    }
  };

  const handleReorderGroups = async (fromGroupId: string, toGroupId: string) => {
    if (fromGroupId === toGroupId) return;

    const fromIndex = groups.findIndex((group) => group.id === fromGroupId);
    const toIndex = groups.findIndex((group) => group.id === toGroupId);
    if (fromIndex < 0 || toIndex < 0) return;

    const nextGroups = [...groups];
    const [movedGroup] = nextGroups.splice(fromIndex, 1);
    nextGroups.splice(toIndex, 0, movedGroup);

    try {
      await reorderGroups(nextGroups.map((group) => group.id));
    } catch (err) {
      console.error("Failed to reorder groups:", err);
    }
  };

  // Close context menu on click outside
  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [contextMenu]);

  // Handle logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  const handleAccountChanged = async () => {
    clear();
    setSelectedListId(null);
    await fetchAll();
  };

  // Get selected list
  const selectedList = selectedListId ? lists.find((l) => l.id === selectedListId) : null;
  const selectedListTasks = selectedList
    ? tasks
        .filter((task) => task.list_id === selectedList.id)
        .sort((a, b) => a.sort_order - b.sort_order)
    : [];

  React.useEffect(() => {
    if (!selectedListId) return;

    let isCancelled = false;
    setIsLoadingTasks(true);

    void fetchTasks()
      .catch((err) => {
        console.error("Failed to fetch tasks:", err);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingTasks(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedListId, fetchTasks]);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-50 dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-zinc-900 dark:text-white">PuraToDo</span>
          </div>
        </div>

        {/* Quick Add */}
        <div className="p-4">
          <button className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium hover:from-violet-500 hover:to-indigo-500 transition-all">
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 overflow-y-auto">
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
              <CheckCircle2 className="w-5 h-5" />
              <span>Today</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
              <Star className="w-5 h-5" />
              <span>Starred</span>
            </button>
          </div>

          {/* Groups section */}
          <div className="mt-6">
            <div className="flex items-center justify-between px-3 mb-2">
              <h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Groups
              </h3>
              <button
                onClick={() => setShowNewGroupInput(true)}
                className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* New group input */}
            {showNewGroupInput && (
              <div className="px-3 py-2 mb-2 bg-white dark:bg-zinc-700 rounded-lg border border-zinc-200 dark:border-zinc-600">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Group name"
                  className="w-full px-2 py-1 text-sm bg-transparent border-none outline-none text-zinc-900 dark:text-white placeholder-zinc-400"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateGroup();
                    if (e.key === "Escape") {
                      setShowNewGroupInput(false);
                      setNewGroupName("");
                    }
                  }}
                />
                <div className="flex items-center gap-1 mt-2">
                  {GROUP_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNewGroupColor(color.value)}
                      className={`w-5 h-5 rounded-full transition-transform ${
                        newGroupColor === color.value ? "ring-2 ring-offset-1 scale-110" : ""
                      }`}
                      style={{ backgroundColor: color.value }}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-end gap-2 mt-2">
                  <button
                    onClick={() => {
                      setShowNewGroupInput(false);
                      setNewGroupName("");
                    }}
                    className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-600 text-zinc-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCreateGroup}
                    disabled={isCreatingGroup || !newGroupName.trim()}
                    className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-600 text-green-500 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Loading state */}
            {isLoading && groups.length === 0 && (
              <div className="px-3 py-4 text-sm text-zinc-400 dark:text-zinc-500">Loading...</div>
            )}

            {/* Error state */}
            {error && (
              <div className="px-3 py-4 text-sm text-red-500 dark:text-red-400">{error}</div>
            )}

            {/* Groups list */}
            <div className="space-y-1">
              {groups.map((group) => {
                const groupLists = getListsForGroup(group.id);
                const isExpanded = expandedGroups.has(group.id);

                return (
                  <div
                    key={group.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (draggingGroupId && draggingGroupId !== group.id) {
                        e.dataTransfer.dropEffect = "move";
                        setDropTargetGroupId(group.id);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const sourceGroupId = e.dataTransfer.getData("text/plain") || draggingGroupId;
                      if (sourceGroupId) {
                        void handleReorderGroups(sourceGroupId, group.id);
                      }
                      setDraggingGroupId(null);
                      setDropTargetGroupId(null);
                    }}
                  >
                    <button
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", group.id);
                        setDraggingGroupId(group.id);
                      }}
                      onDragEnd={() => {
                        setDraggingGroupId(null);
                        setDropTargetGroupId(null);
                      }}
                      onClick={() => toggleGroup(group.id)}
                      onContextMenu={(e) => handleContextMenu(e, group)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors group ${
                        draggingGroupId === group.id ? "opacity-60" : ""
                      } ${
                        dropTargetGroupId === group.id && draggingGroupId !== group.id
                          ? "ring-2 ring-violet-300 dark:ring-violet-700"
                          : ""
                      }`}
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                      />
                      <Folder className="w-5 h-5" style={{ color: group.color ?? undefined }} />
                      <span className="flex-1 text-left truncate">{group.name}</span>
                      <button
                        onClick={(e) => handleDeleteGroup(group.id, e)}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-400 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </button>

                    {/* Lists under group */}
                    {isExpanded && groupLists.length > 0 && (
                      <div className="ml-6 mt-1 space-y-1">
                        {groupLists.map((list) => (
                          <button
                            key={list.id}
                            onClick={() => setSelectedListId(list.id)}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                              selectedListId === list.id
                                ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            }`}
                          >
                            <List className="w-4 h-4" />
                            <span className="truncate">{list.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Empty state */}
              {!isLoading && groups.length === 0 && !showNewGroupInput && (
                <div className="px-3 py-4 text-sm text-zinc-400 dark:text-zinc-500">
                  No groups yet. Click + to create one.
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="text-sm">
                <p className="font-medium text-zinc-900 dark:text-white truncate max-w-24">
                  {user?.name || user?.email?.split("@")[0] || "User"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <AccountSettingsDialog
                onAccountChanged={handleAccountChanged}
                trigger={(
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    title="Account Settings"
                  >
                    <Users className="w-4 h-4" />
                  </Button>
                )}
              />
              <ApiServerSettingsDialog
                onSaved={fetchAll}
                trigger={(
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    title="API Server Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                )}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-700 flex items-center px-6">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
            {selectedList ? selectedList.name : "Today"}
          </h1>
        </header>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            {selectedList && selectedListTasks.length > 0 ? (
              <div className="space-y-3">
                {selectedListTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  >
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        task.completed
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-zinc-300 dark:border-zinc-600"
                      }`}
                    >
                      {task.completed ? <Check className="w-3 h-3" /> : null}
                    </div>
                    <span
                      className={`text-sm ${
                        task.completed
                          ? "line-through text-zinc-400 dark:text-zinc-500"
                          : "text-zinc-800 dark:text-zinc-100"
                      }`}
                    >
                      {task.name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
                </div>
                <h2 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">
                  {isLoadingTasks && selectedList ? "Loading tasks..." : selectedList ? `No tasks in "${selectedList.name}"` : "No tasks yet"}
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                  Get started by creating your first task
                </p>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  <span>Create Task</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-32 bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg shadow-lg py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => openEditDialog(contextMenu.group)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-600"
          >
            <Pencil className="w-4 h-4" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => handleDeleteGroup(contextMenu.group.id)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-600"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Edit Group Dialog */}
      <Dialog open={!!editingGroup} onOpenChange={(open) => !open && setEditingGroup(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Group Name
              </label>
              <input
                type="text"
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                placeholder="Enter group name"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdateGroup();
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Color
              </label>
              <div className="flex items-center gap-2">
                {GROUP_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setEditGroupColor(color.value)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      editGroupColor === color.value ? "ring-2 ring-offset-2 ring-violet-500 scale-110" : ""
                    }`}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setEditingGroup(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateGroup}
              disabled={isUpdatingGroup || !editGroupName.trim()}
            >
              {isUpdatingGroup ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DashboardPage;
