'use client'

import type { DragEndEvent } from '@dnd-kit/core'
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
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@puratodo/ui'
import {
  AlertTriangle,
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
  Star,
  Sun,
} from 'lucide-react'
import { useEffect, useState } from 'react'

/**
 * Sidebar component for PuraToDo apps
 *
 * Provides a navigation sidebar with:
 * - Quick views (Today, Calendar, Inbox)
 * - Smart views (Starred, Overdue, Next 7 Days, No Date)
 * - Groups with nested lists
 * - Drag-and-drop reordering for groups and lists
 * - Group management (create/edit/delete) via callbacks
 */

export interface Group {
  id: string
  name: string
  color: string | null
  sort_order: number
}

export interface List {
  id: string
  group_id: string
  name: string
  icon: string | null
  sort_order: number
}

export type SmartView = 'starred' | 'overdue' | 'next7days' | 'nodate'

export interface SidebarLabels {
  today: string
  calendar: string
  inbox: string
  smartViews: string
  starred: string
  overdue: string
  next7Days: string
  noDate: string
  groups: string
  addGroup: string
  noGroups: string
  createFirstGroup: string
  addList: string
  edit: string
  delete: string
}

export interface SidebarProps {
  groups: Group[]
  lists: List[]
  selectedGroupId: string | null
  selectedListId: string | null
  showTodayView: boolean
  showCalendarView: boolean
  showInboxView: boolean
  selectedSmartView: SmartView | null
  onGroupSelect: (groupId: string | null) => void
  onListSelect: (listId: string | null, groupId: string) => void
  onTodaySelect: () => void
  onCalendarSelect: () => void
  onInboxSelect: () => void
  onSmartViewSelect: (view: SmartView) => void
  onGroupEdit: (group: Group) => void
  onGroupDelete: (group: Group) => void
  onAddListRequest: (groupId: string) => void
  onListEdit?: (list: List) => void
  onListDelete?: (list: List) => void
  onGroupReorder: (groupIds: string[]) => void
  onListReorder: (groupId: string, listIds: string[]) => void
  onAddGroupRequest?: () => void
  labels: SidebarLabels
  headerContent?: React.ReactNode
  footerContent?: React.ReactNode
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
  onListEdit?: (list: List) => void
  onListDelete?: (list: List) => void
  labels: SidebarLabels
}

interface SortableSidebarListItemProps {
  list: List
  groupId: string
  isSelected: boolean
  onSelect: (listId: string, groupId: string) => void
  onEdit?: (list: List) => void
  onDelete?: (list: List) => void
  labels: SidebarLabels
}

function SortableSidebarListItem({
  list,
  groupId,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  labels,
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
      {(onEdit || onDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="h-5 w-5 opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-24">
            {onEdit && <DropdownMenuItem onClick={() => onEdit(list)}>{labels.edit}</DropdownMenuItem>}
            {onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(list)}
                className="text-red-600 dark:text-red-400"
              >
                {labels.delete}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
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
  onListEdit,
  onListDelete,
  labels,
}: SortableGroupItemProps) {
  const [localLists, setLocalLists] = useState(lists)

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
    if (target.closest('[data-radix-collection-item]') || target.closest('button[data-state]')) {
      return
    }
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

        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: group.color || '#6b7280' }}
        />

        <Folder className="h-4 w-4 text-stone-400 flex-shrink-0" />

        <span className="flex-1 text-sm text-stone-700 dark:text-stone-300 truncate">
          {group.name}
        </span>

        {lists.length > 0 && (
          <span className="text-xs text-stone-400 mr-1">{lists.length}</span>
        )}

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
              {labels.addList}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(group)}>
              {labels.edit}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(group)}
              className="text-red-600 dark:text-red-400"
            >
              {labels.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
                  onEdit={onListEdit}
                  onDelete={onListDelete}
                  labels={labels}
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
  groups: initialGroups,
  lists,
  selectedGroupId,
  selectedListId,
  showTodayView,
  showCalendarView,
  showInboxView,
  selectedSmartView,
  onGroupSelect,
  onListSelect,
  onTodaySelect,
  onCalendarSelect,
  onInboxSelect,
  onSmartViewSelect,
  onGroupEdit,
  onGroupDelete,
  onAddListRequest,
  onListEdit,
  onListDelete,
  onGroupReorder,
  onListReorder,
  onAddGroupRequest,
  labels,
  headerContent,
  footerContent,
}: SidebarProps) {
  const [groups, setGroups] = useState(initialGroups)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(initialGroups.map(g => g.id)),
  )

  useEffect(() => {
    setGroups(initialGroups)
  }, [initialGroups])

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = groups.findIndex(g => g.id === active.id)
      const newIndex = groups.findIndex(g => g.id === over.id)
      const newGroups = arrayMove(groups, oldIndex, newIndex)
      setGroups(newGroups)
      const orderedIds = newGroups.map(g => g.id)
      onGroupReorder(orderedIds)
    }
  }

  return (
    <aside className="w-64 h-screen bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex flex-col">
      {headerContent}

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
          <span className="text-sm font-medium">{labels.today}</span>
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
          <span className="text-sm font-medium">{labels.calendar}</span>
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
          <span className="text-sm font-medium">{labels.inbox}</span>
        </button>
      </div>

      {/* Smart Views */}
      <div className="px-2 pb-1">
        <div className="px-3 py-1 text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
          {labels.smartViews}
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
          <span className="text-sm">{labels.starred}</span>
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
          <span className="text-sm">{labels.overdue}</span>
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
          <span className="text-sm">{labels.next7Days}</span>
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
          <span className="text-sm">{labels.noDate}</span>
        </button>
      </div>

      {/* Groups Section */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex items-center justify-between px-2 py-1.5 mb-1">
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            {labels.groups}
          </span>
          {onAddGroupRequest && (
            <Button
              variant="ghost"
              size="icon-xs"
              title={labels.addGroup}
              onClick={onAddGroupRequest}
              className="h-5 w-5"
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>

        {groups.length === 0
          ? (
              <div className="px-2 py-4 text-center">
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  {labels.noGroups}
                </p>
                {onAddGroupRequest && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={onAddGroupRequest}
                  >
                    {labels.createFirstGroup}
                  </Button>
                )}
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
                      const groupLists = lists.filter(l => l.group_id === group.id)
                      return (
                        <SortableGroupItem
                          key={group.id}
                          group={group}
                          lists={groupLists}
                          isExpanded={expandedGroups.has(group.id)}
                          onToggleExpand={() => toggleExpand(group.id)}
                          onEdit={onGroupEdit}
                          onDelete={onGroupDelete}
                          isSelected={selectedGroupId === group.id}
                          onSelect={onGroupSelect}
                          selectedListId={selectedListId}
                          onListSelect={onListSelect}
                          onAddList={onAddListRequest}
                          onReorderLists={onListReorder}
                          onListEdit={onListEdit}
                          onListDelete={onListDelete}
                          labels={labels}
                        />
                      )
                    })}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
      </div>

      {footerContent}
    </aside>
  )
}
