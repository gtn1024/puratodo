'use client'

import type { DragEndEvent } from '@dnd-kit/core'
import type { Group } from '@/actions/groups'
import type { List } from '@/actions/lists'
import {
  closestCenter,
  DndContext,

  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Circle,
  Folder,
  GripVertical,
  Inbox,
  MoreHorizontal,
  Plus,
  Settings,
  Star,
  Sun,
  User,
} from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { createGroup, deleteGroup, reorderGroups, updateGroup } from '@/actions/groups'
import { reorderLists } from '@/actions/lists'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/i18n'

interface SidebarProps {
  initialGroups: Group[]
  initialLists: List[]
  selectedGroupId: string | null
  selectedListId: string | null
  showTodayView: boolean
  showCalendarView: boolean
  showInboxView: boolean
  showReviewView: boolean
  selectedSmartView: 'starred' | 'overdue' | 'next7days' | 'nodate' | null
  userInfo: {
    id: string
    email?: string
    displayName: string | null
    avatarUrl: string | null
  }
  onGroupSelect: (groupId: string | null) => void
  onListSelect: (listId: string | null, groupId: string) => void
  onTodaySelect: () => void
  onCalendarSelect: () => void
  onInboxSelect: () => void
  onReviewSelect: () => void
  onSmartViewSelect: (view: 'starred' | 'overdue' | 'next7days' | 'nodate') => void
  onDataChange: () => void
  onAddListRequest: (groupId: string) => void
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
]

interface SortableGroupItemProps {
  group: Group
  lists: List[]
  isExpanded: boolean
  onToggleExpand: () => void
  onEdit: (group: Group) => void
  onDelete: (group: Group) => void
  isSelected: boolean
  onSelect: (groupId: string) => void
  selectedListId: string | null
  onListSelect: (listId: string, groupId: string) => void
  onAddList: (groupId: string) => void
  onReorderLists: (groupId: string, orderedIds: string[]) => void
}

// Sortable list item for sidebar
interface SortableSidebarListItemProps {
  list: List
  groupId: string
  isSelected: boolean
  onSelect: (listId: string, groupId: string) => void
}

function SortableSidebarListItem({
  list,
  groupId,
  isSelected,
  onSelect,
}: SortableSidebarListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: list.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer group ${
        isSelected
          ? 'bg-stone-100 dark:bg-stone-800'
          : 'hover:bg-stone-100 dark:hover:bg-stone-800'
      }`}
      onClick={() => onSelect(list.id, groupId)}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <span className="text-base">{list.icon || '📋'}</span>
      <span className="flex-1 text-sm text-stone-600 dark:text-stone-400 truncate">
        {list.name}
      </span>
    </li>
  )
}

function SortableGroupItem({
  group,
  lists,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  isSelected,
  onSelect,
  selectedListId,
  onListSelect,
  onAddList,
  onReorderLists,
}: SortableGroupItemProps) {
  const { t } = useI18n()
  const [localLists, setLocalLists] = useState(lists)

  // Sync local lists when props change
  useEffect(() => {
    setLocalLists(lists)
  }, [lists])

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id })

  const listSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleListDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = localLists.findIndex(l => l.id === active.id)
      const newIndex = localLists.findIndex(l => l.id === over.id)
      const newLists = arrayMove(localLists, oldIndex, newIndex)
      setLocalLists(newLists)
      const orderedIds = newLists.map(l => l.id)
      onReorderLists(group.id, orderedIds)
    }
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    // Ignore clicks on dropdown menu items or buttons with state
    if (target.closest('[data-radix-collection-item]') || target.closest('button[data-state]')) {
      return
    }
    // Clicking the group name area selects the group (navigates to group page)
    onSelect(group.id)
  }

  return (
    <li ref={setNodeRef} style={style}>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-md group cursor-pointer ${
          isSelected && !selectedListId
            ? 'bg-stone-100 dark:bg-stone-800'
            : 'hover:bg-stone-100 dark:hover:bg-stone-800'
        }`}
        onClick={handleClick}
      >
        {/* Expand/Collapse Chevron */}
        <button
          className="p-0.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpand()
          }}
        >
          {lists.length > 0
            ? (
                isExpanded
                  ? (
                      <ChevronDown className="h-3.5 w-3.5 text-stone-500" />
                    )
                  : (
                      <ChevronRight className="h-3.5 w-3.5 text-stone-500" />
                    )
              )
            : (
                <div className="h-3.5 w-3.5" />
              )}
        </button>

        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        {/* Color Dot */}
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: group.color || '#6b7280' }}
        />

        {/* Folder Icon */}
        <Folder className="h-4 w-4 text-stone-400 flex-shrink-0" />

        {/* Group Name */}
        <span className="flex-1 text-sm text-stone-700 dark:text-stone-300 truncate">
          {group.name}
        </span>

        {/* List Count Badge */}
        {lists.length > 0 && (
          <span className="text-xs text-stone-400 mr-1">
            {lists.length}
          </span>
        )}

        {/* Dropdown Menu */}
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
            <DropdownMenuItem onClick={() => onAddList(group.id)}>
              {t('sidebar.labels.addList')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(group)}>
              {t('common.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(group)}
              className="text-red-600 dark:text-red-400"
            >
              {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Child Lists */}
      {isExpanded && localLists.length > 0 && (
        <DndContext
          sensors={listSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleListDragEnd}
        >
          <SortableContext
            items={localLists.map(l => l.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="ml-8 mt-1 space-y-0.5 border-l-2 border-stone-200 dark:border-stone-700 pl-3">
              {localLists.map(list => (
                <SortableSidebarListItem
                  key={list.id}
                  list={list}
                  groupId={group.id}
                  isSelected={selectedListId === list.id}
                  onSelect={onListSelect}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </li>
  )
}

export function Sidebar({
  initialGroups,
  initialLists,
  selectedGroupId,
  selectedListId,
  showTodayView,
  showCalendarView,
  showInboxView,
  showReviewView,
  selectedSmartView,
  userInfo,
  onGroupSelect,
  onListSelect,
  onTodaySelect,
  onCalendarSelect,
  onInboxSelect,
  onReviewSelect,
  onSmartViewSelect,
  onDataChange,
  onAddListRequest,
}: SidebarProps) {
  const { t } = useI18n()
  const [groups, setGroups] = useState(initialGroups)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(initialGroups.map(g => g.id)), // Start with all expanded
  )
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const toggleExpand = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      }
      else {
        next.add(groupId)
      }
      return next
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = groups.findIndex(g => g.id === active.id)
      const newIndex = groups.findIndex(g => g.id === over.id)
      const newGroups = arrayMove(groups, oldIndex, newIndex)
      setGroups(newGroups)
      const orderedIds = newGroups.map(g => g.id)
      await reorderGroups(orderedIds)
    }
  }

  const handleCreate = async () => {
    if (!name.trim())
      return
    setIsLoading(true)
    const result = await createGroup(name.trim(), color || undefined)
    if (result.success) {
      setIsCreateOpen(false)
      setName('')
      setColor(null)
      onDataChange()
    }
    setIsLoading(false)
  }

  const handleEdit = async () => {
    if (!selectedGroup || !name.trim())
      return
    setIsLoading(true)
    const result = await updateGroup(selectedGroup.id, {
      name: name.trim(),
      color: color || undefined,
    })
    if (result.success) {
      setIsEditOpen(false)
      setSelectedGroup(null)
      setName('')
      setColor(null)
      onDataChange()
    }
    setIsLoading(false)
  }

  const handleDelete = async () => {
    if (!selectedGroup)
      return
    setIsLoading(true)
    const result = await deleteGroup(selectedGroup.id)
    if (result.success) {
      setIsDeleteOpen(false)
      setSelectedGroup(null)
      onDataChange()
    }
    setIsLoading(false)
  }

  const openEditDialog = (group: Group) => {
    setSelectedGroup(group)
    setName(group.name)
    setColor(group.color)
    setIsEditOpen(true)
  }

  const openDeleteDialog = (group: Group) => {
    setSelectedGroup(group)
    setIsDeleteOpen(true)
  }

  const handleAddList = (groupId: string) => {
    onAddListRequest(groupId)
  }

  const handleReorderLists = async (groupId: string, orderedIds: string[]) => {
    await reorderLists(groupId, orderedIds)
    onDataChange()
  }

  return (
    <>
      <aside className="w-64 h-screen bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between">
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
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>

        {/* Today View Shortcut */}
        <div className="px-2 py-1">
          <button
            onClick={onTodaySelect}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              showTodayView
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
            }`}
          >
            <Sun className={`h-4 w-4 ${showTodayView ? 'text-amber-500' : ''}`} />
            <span className="text-sm font-medium">{t('sidebar.today')}</span>
          </button>
          <button
            onClick={onCalendarSelect}
            className={`mt-1 w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              showCalendarView
                ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
            }`}
          >
            <Calendar className={`h-4 w-4 ${showCalendarView ? 'text-violet-500' : ''}`} />
            <span className="text-sm font-medium">{t('calendar.title')}</span>
          </button>
          <button
            onClick={onInboxSelect}
            className={`mt-1 w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              showInboxView
                ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
                : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
            }`}
          >
            <Inbox className={`h-4 w-4 ${showInboxView ? 'text-sky-500' : ''}`} />
            <span className="text-sm font-medium">{t('sidebar.inbox')}</span>
          </button>
          <button
            onClick={onReviewSelect}
            className={`mt-1 w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              showReviewView
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
            }`}
          >
            <BarChart3 className={`h-4 w-4 ${showReviewView ? 'text-emerald-500' : ''}`} />
            <span className="text-sm font-medium">{t('review.title')}</span>
          </button>
        </div>

        {/* Smart Views */}
        <div className="px-2 pb-1">
          <div className="px-3 py-1 text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            {t('sidebar.smartViews')}
          </div>
          <button
            onClick={() => onSmartViewSelect('starred')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              selectedSmartView === 'starred'
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
            }`}
          >
            <Star className={`h-4 w-4 ${selectedSmartView === 'starred' ? 'text-yellow-500' : ''}`} />
            <span className="text-sm">{t('sidebar.starred')}</span>
          </button>
          <button
            onClick={() => onSmartViewSelect('overdue')}
            className={`mt-1 w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              selectedSmartView === 'overdue'
                ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
                : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
            }`}
          >
            <AlertTriangle className={`h-4 w-4 ${selectedSmartView === 'overdue' ? 'text-rose-500' : ''}`} />
            <span className="text-sm">{t('sidebar.overdue')}</span>
          </button>
          <button
            onClick={() => onSmartViewSelect('next7days')}
            className={`mt-1 w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              selectedSmartView === 'next7days'
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
            }`}
          >
            <CalendarDays className={`h-4 w-4 ${selectedSmartView === 'next7days' ? 'text-indigo-500' : ''}`} />
            <span className="text-sm">{t('sidebar.next7Days')}</span>
          </button>
          <button
            onClick={() => onSmartViewSelect('nodate')}
            className={`mt-1 w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              selectedSmartView === 'nodate'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
            }`}
          >
            <Circle className={`h-4 w-4 ${selectedSmartView === 'nodate' ? 'text-slate-500' : ''}`} />
            <span className="text-sm">{t('sidebar.noDate')}</span>
          </button>
        </div>

        {/* Groups Section */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="flex items-center justify-between px-2 py-1.5 mb-1">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              {t('sidebar.groups')}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              title={t('sidebar.addGroup')}
              onClick={() => {
                setName('')
                setColor(null)
                setIsCreateOpen(true)
              }}
              className="h-5 w-5"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {groups.length === 0
            ? (
                <div className="px-2 py-4 text-center">
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    {t('sidebar.noGroups')}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={() => setIsCreateOpen(true)}
                  >
                    {t('sidebar.createFirstGroup')}
                  </Button>
                </div>
              )
            : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={groups.map(g => g.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <ul className="space-y-0.5">
                      {groups.map((group) => {
                        const groupLists = initialLists.filter(
                          l => l.group_id === group.id,
                        )
                        return (
                          <SortableGroupItem
                            key={group.id}
                            group={group}
                            lists={groupLists}
                            isExpanded={expandedGroups.has(group.id)}
                            onToggleExpand={() => toggleExpand(group.id)}
                            onEdit={openEditDialog}
                            onDelete={openDeleteDialog}
                            isSelected={selectedGroupId === group.id}
                            onSelect={onGroupSelect}
                            selectedListId={selectedListId}
                            onListSelect={onListSelect}
                            onAddList={handleAddList}
                            onReorderLists={handleReorderLists}
                          />
                        )
                      })}
                    </ul>
                  </SortableContext>
                </DndContext>
              )}
        </div>

        {/* User Section */}
        <div className="border-t border-stone-200 dark:border-stone-800 p-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center overflow-hidden flex-shrink-0">
              {userInfo.avatarUrl
                ? (
                    <Image
                      src={userInfo.avatarUrl}
                      alt={userInfo.displayName || userInfo.email || 'User'}
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  )
                : (
                    <User className="h-4 w-4 text-stone-500 dark:text-stone-400" />
                  )}
            </div>
            {/* User Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                {userInfo.displayName || 'User'}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                {userInfo.email}
              </p>
            </div>
            {/* Settings Link */}
            <a
              href="/dashboard/settings"
              className="p-1.5 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
              title={t('common.settings')}
            >
              <Settings className="h-4 w-4" />
            </a>
          </div>
        </div>
      </aside>

      {/* Create Group Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('common.create')}
              {' '}
              {t('sidebar.groups').toLowerCase()}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">{t('sidebar.groups')}</Label>
              <Input
                id="create-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('sidebar.groups')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('sidebar.labels.color')}</Label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      color === c
                        ? 'border-stone-900 dark:border-stone-100 scale-110'
                        : 'border-transparent'
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
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={isLoading || !name.trim()}>
              {t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('common.edit')}
              {' '}
              {t('sidebar.groups').toLowerCase()}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t('sidebar.groups')}</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('sidebar.groups')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('sidebar.labels.color')}</Label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      color === c
                        ? 'border-stone-900 dark:border-stone-100 scale-110'
                        : 'border-transparent'
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
              {t('common.cancel')}
            </Button>
            <Button onClick={handleEdit} disabled={isLoading || !name.trim()}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {t('common.delete')}
              {' '}
              {t('sidebar.groups').toLowerCase()}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {t('common.confirm')}
            {' '}
            &ldquo;
            {selectedGroup?.name}
            &rdquo;?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
