'use client'

import type { UserInfo } from './page'
import type { Group } from '@/actions/groups'
import type { List } from '@/actions/lists'
import type { KeyboardShortcut } from '@/hooks/use-keyboard-shortcuts'
import { AlertTriangle, BarChart3, CalendarDays, Calendar as CalendarIcon, Circle, Inbox, Menu, Search, Star, Sun } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getLists, getOrCreateInboxList } from '@/actions/lists'
import { CalendarPanel } from '@/components/dashboard/calendar-panel'
import { ListPanel } from '@/components/dashboard/list-panel'
import { ReminderScheduler } from '@/components/dashboard/reminder-scheduler'
import { ReviewPanel } from '@/components/dashboard/review-panel'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TaskPanelSkeleton } from '@/components/dashboard/skeletons'
import { TaskDetailPanel } from '@/components/dashboard/task-detail-panel'
import { TaskDetailSheet } from '@/components/dashboard/task-detail-sheet'
import { TaskPanel } from '@/components/dashboard/task-panel'
import { TodayPanel } from '@/components/dashboard/today-panel'
import {
  KeyboardShortcutsButton,
  KeyboardShortcutsDialog,
} from '@/components/keyboard-shortcuts-dialog'
import { SearchDialog } from '@/components/search-dialog'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useRealtime } from '@/hooks/use-realtime'
import { useI18n } from '@/i18n'
import { LogoutButton } from './logout-button'

interface DashboardContentProps {
  initialGroups: Group[]
  allLists: List[]
  userInfo: UserInfo
}

type SmartViewType = 'starred' | 'overdue' | 'next7days' | 'nodate'

export function DashboardContent({ initialGroups, allLists, userInfo }: DashboardContentProps) {
  const { t } = useI18n()
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    initialGroups.length > 0 ? initialGroups[0].id : null,
  )
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [lists, setLists] = useState<List[]>(allLists)
  const [refreshKey, setRefreshKey] = useState(0)
  const [addListRequestKey, setAddListRequestKey] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false)
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [showTodayView, setShowTodayView] = useState(false)
  const [showCalendarView, setShowCalendarView] = useState(false)
  const [showInboxView, setShowInboxView] = useState(false)
  const [showReviewView, setShowReviewView] = useState(false)
  const [selectedSmartView, setSelectedSmartView] = useState<SmartViewType | null>(null)
  const [inboxListId, setInboxListId] = useState<string | null>(
    allLists.find(list => list.name === 'Inbox')?.id || null,
  )
  const [isLoadingInbox, setIsLoadingInbox] = useState(false)
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)

  // Refs for triggering creation in child components
  const listPanelRef = useRef<{ triggerCreateList: () => void }>(null)
  const taskPanelRef = useRef<{ triggerCreateTask: () => void }>(null)
  const pendingCreateListGroupIdRef = useRef<string | null>(null)

  const selectedGroup = initialGroups.find(g => g.id === selectedGroupId) || null
  const selectedList = lists.find(l => l.id === selectedListId) || null
  const inboxList = inboxListId ? lists.find(list => list.id === inboxListId) || null : null

  // Filter lists for the selected group
  const groupLists = selectedGroupId
    ? lists.filter(l => l.group_id === selectedGroupId)
    : []

  useEffect(() => {
    async function loadLists() {
      const data = await getLists()
      setLists(data)
    }
    if (refreshKey > 0) {
      loadLists()
    }
  }, [refreshKey])

  const handleListsChange = () => {
    setRefreshKey(k => k + 1)
  }

  const handleListSelect = (listId: string | null, groupId: string) => {
    setSelectedGroupId(groupId)
    setSelectedListId(listId)
    setSelectedTaskId(null) // Deselect task when changing list
    setShowTodayView(false) // Exit today view when selecting list
    setShowCalendarView(false) // Exit calendar view when selecting list
    setShowInboxView(false) // Exit inbox view when selecting list
    setShowReviewView(false) // Exit review view when selecting list
    setSelectedSmartView(null) // Exit smart view when selecting list
    setMobileMenuOpen(false) // Close mobile menu on selection
  }

  const handleGroupSelect = (groupId: string | null) => {
    setSelectedGroupId(groupId)
    // When selecting a group, deselect the list
    if (groupId !== selectedGroupId) {
      setSelectedListId(null)
      setSelectedTaskId(null) // Deselect task when changing group
    }
    setShowTodayView(false) // Exit today view when selecting group
    setShowCalendarView(false) // Exit calendar view when selecting group
    setShowInboxView(false) // Exit inbox view when selecting group
    setShowReviewView(false) // Exit review view when selecting group
    setSelectedSmartView(null) // Exit smart view when selecting group
    setMobileMenuOpen(false) // Close mobile menu on selection
  }

  const handleTodaySelect = () => {
    setShowTodayView(true)
    setShowCalendarView(false)
    setShowInboxView(false)
    setShowReviewView(false)
    setSelectedGroupId(null)
    setSelectedListId(null)
    setSelectedTaskId(null)
    setSelectedSmartView(null)
    setMobileMenuOpen(false)
  }

  const handleCalendarSelect = () => {
    setShowTodayView(false)
    setShowCalendarView(true)
    setShowInboxView(false)
    setShowReviewView(false)
    setSelectedGroupId(null)
    setSelectedListId(null)
    setSelectedTaskId(null)
    setSelectedSmartView(null)
    setMobileMenuOpen(false)
  }

  const handleInboxSelect = async () => {
    setShowTodayView(false)
    setShowCalendarView(false)
    setShowInboxView(true)
    setShowReviewView(false)
    setSelectedGroupId(null)
    setSelectedListId(null)
    setSelectedTaskId(null)
    setSelectedSmartView(null)
    setMobileMenuOpen(false)
    setIsLoadingInbox(true)

    const resolvedInboxList = await getOrCreateInboxList()
    if (resolvedInboxList) {
      setInboxListId(resolvedInboxList.id)
      setLists((prev) => {
        const existingIndex = prev.findIndex(list => list.id === resolvedInboxList.id)
        if (existingIndex >= 0) {
          const next = [...prev]
          next[existingIndex] = resolvedInboxList
          return next
        }
        return [...prev, resolvedInboxList]
      })
    }

    setIsLoadingInbox(false)
  }

  const handleSmartViewSelect = (view: SmartViewType) => {
    setShowTodayView(false)
    setShowCalendarView(false)
    setShowInboxView(false)
    setShowReviewView(false)
    setSelectedGroupId(null)
    setSelectedListId(null)
    setSelectedTaskId(null)
    setSelectedSmartView(view)
    setMobileMenuOpen(false)
  }

  const handleReviewSelect = () => {
    setShowTodayView(false)
    setShowCalendarView(false)
    setShowInboxView(false)
    setShowReviewView(true)
    setSelectedGroupId(null)
    setSelectedListId(null)
    setSelectedTaskId(null)
    setSelectedSmartView(null)
    setMobileMenuOpen(false)
  }

  const handleSidebarAddList = (groupId: string) => {
    setSelectedGroupId(groupId)
    setSelectedListId(null)
    setSelectedTaskId(null)
    setShowTodayView(false)
    setShowCalendarView(false)
    setShowInboxView(false)
    setShowReviewView(false)
    setSelectedSmartView(null)
    setMobileMenuOpen(false)
    pendingCreateListGroupIdRef.current = groupId
    setAddListRequestKey(k => k + 1)
  }

  // Handle task selection from TaskPanel
  const handleTaskSelect = useCallback((taskId: string | null) => {
    setSelectedTaskId(taskId)
    // On smaller screens (not large desktop), open the detail sheet instead of side panel
    if (taskId && window.innerWidth < 1280) {
      setMobileDetailOpen(true)
    }
  }, [])

  // Handle task selection from search
  const handleSearchTaskSelect = useCallback((taskId: string, listId: string, groupId: string) => {
    const list = lists.find(l => l.id === listId)
    const resolvedGroupId = list?.group_id || groupId

    setSelectedGroupId(resolvedGroupId)
    setSelectedListId(listId)
    setSelectedTaskId(taskId)
    setShowTodayView(false)
    setShowCalendarView(false)
    setShowInboxView(false)
    setSelectedSmartView(null)
    // On smaller screens (not large desktop), open the detail sheet
    if (window.innerWidth < 1280) {
      setMobileDetailOpen(true)
    }
  }, [lists])

  // Handle closing the detail panel
  const handleCloseDetail = useCallback(() => {
    setSelectedTaskId(null)
    setMobileDetailOpen(false)
  }, [])

  // Keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'n',
      action: useCallback(() => {
        if (selectedList || showInboxView) {
          taskPanelRef.current?.triggerCreateTask()
        }
        else if (selectedGroup) {
          listPanelRef.current?.triggerCreateList()
        }
      }, [selectedList, selectedGroup, showInboxView]),
      description: t('accessibility.newTaskList'),
    },
    {
      key: 'l',
      action: useCallback(() => {
        if (selectedGroup && !selectedList) {
          listPanelRef.current?.triggerCreateList()
        }
      }, [selectedGroup, selectedList]),
      description: t('accessibility.newList'),
    },
    {
      key: '?',
      action: useCallback(() => {
        setShortcutsDialogOpen(true)
      }, []),
      description: t('accessibility.showShortcuts'),
    },
    {
      key: 'Escape',
      action: useCallback(() => {
        if (searchDialogOpen) {
          setSearchDialogOpen(false)
        }
        else if (mobileMenuOpen) {
          setMobileMenuOpen(false)
        }
        else if (mobileDetailOpen) {
          setMobileDetailOpen(false)
          setSelectedTaskId(null)
        }
        else if (selectedTaskId) {
          setSelectedTaskId(null)
        }
        else if (shortcutsDialogOpen) {
          setShortcutsDialogOpen(false)
        }
      }, [searchDialogOpen, mobileMenuOpen, mobileDetailOpen, selectedTaskId, shortcutsDialogOpen]),
      description: t('accessibility.closeDialog'),
    },
  ]

  // Ctrl/Cmd + K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchDialogOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useKeyboardShortcuts({ shortcuts })

  useEffect(() => {
    const pendingGroupId = pendingCreateListGroupIdRef.current
    if (!pendingGroupId)
      return
    if (selectedGroupId !== pendingGroupId)
      return
    if (selectedListId || showTodayView || showInboxView || selectedSmartView)
      return

    if (listPanelRef.current) {
      listPanelRef.current.triggerCreateList()
      pendingCreateListGroupIdRef.current = null
    }
  }, [
    addListRequestKey,
    selectedGroupId,
    selectedListId,
    showTodayView,
    showInboxView,
    selectedSmartView,
  ])

  // Realtime subscriptions
  const handleRealtimeChange = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  useRealtime({
    channel: 'groups-realtime',
    table: 'groups',
    onInsert: handleRealtimeChange,
    onUpdate: handleRealtimeChange,
    onDelete: handleRealtimeChange,
  })

  useRealtime({
    channel: 'lists-realtime',
    table: 'lists',
    onInsert: handleRealtimeChange,
    onUpdate: handleRealtimeChange,
    onDelete: handleRealtimeChange,
  })

  return (
    <div className="flex h-screen bg-stone-50 dark:bg-stone-950">
      {/* Reminder scheduler - handles browser notifications */}
      <ReminderScheduler enabled={true} />

      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <Sidebar
          initialGroups={initialGroups}
          initialLists={lists}
          selectedGroupId={selectedGroupId}
          selectedListId={selectedListId}
          showTodayView={showTodayView}
          showCalendarView={showCalendarView}
          showInboxView={showInboxView}
          showReviewView={showReviewView}
          selectedSmartView={selectedSmartView}
          userInfo={userInfo}
          onGroupSelect={handleGroupSelect}
          onListSelect={handleListSelect}
          onTodaySelect={handleTodaySelect}
          onCalendarSelect={handleCalendarSelect}
          onInboxSelect={handleInboxSelect}
          onReviewSelect={handleReviewSelect}
          onSmartViewSelect={handleSmartViewSelect}
          onDataChange={handleListsChange}
          onAddListRequest={handleSidebarAddList}
        />
      </div>

      {/* Mobile Sidebar - Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64" showCloseButton={false}>
          <SheetHeader className="sr-only">
            <SheetTitle>{t('dashboard.navigation.title')}</SheetTitle>
            <SheetDescription>{t('dashboard.navigation.description')}</SheetDescription>
          </SheetHeader>
          <Sidebar
            initialGroups={initialGroups}
            initialLists={lists}
            selectedGroupId={selectedGroupId}
            selectedListId={selectedListId}
            showTodayView={showTodayView}
            showCalendarView={showCalendarView}
            showInboxView={showInboxView}
            showReviewView={showReviewView}
            selectedSmartView={selectedSmartView}
            userInfo={userInfo}
            onGroupSelect={handleGroupSelect}
            onListSelect={handleListSelect}
            onTodaySelect={handleTodaySelect}
            onCalendarSelect={handleCalendarSelect}
            onInboxSelect={handleInboxSelect}
            onReviewSelect={handleReviewSelect}
            onSmartViewSelect={handleSmartViewSelect}
            onDataChange={handleListsChange}
            onAddListRequest={handleSidebarAddList}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
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
                <span className="sr-only">{t('dashboard.navigation.openMenu')}</span>
              </Button>

              {showTodayView
                ? (
                    <>
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Sun className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                        {t('dashboard.smartViews.today')}
                      </h1>
                    </>
                  )
                : showCalendarView
                  ? (
                      <>
                        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                          <CalendarIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                          {t('dashboard.smartViews.calendar')}
                        </h1>
                      </>
                    )
                  : showInboxView
                    ? (
                        <>
                          <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                            <Inbox className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                          </div>
                          <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                            {t('dashboard.smartViews.inbox')}
                          </h1>
                        </>
                      )
                    : showReviewView
                      ? (
                          <>
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                              <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                              {t('review.title')}
                            </h1>
                          </>
                        )
                      : selectedSmartView === 'starred'
                        ? (
                            <>
                              <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                <Star className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                              </div>
                              <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                                {t('dashboard.smartViews.starred')}
                              </h1>
                            </>
                          )
                        : selectedSmartView === 'overdue'
                          ? (
                              <>
                                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                                  <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                </div>
                                <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                                  {t('dashboard.smartViews.overdue')}
                                </h1>
                              </>
                            )
                          : selectedSmartView === 'next7days'
                            ? (
                                <>
                                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                    <CalendarDays className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                  </div>
                                  <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                                    {t('dashboard.smartViews.next7Days')}
                                  </h1>
                                </>
                              )
                            : selectedSmartView === 'nodate'
                              ? (
                                  <>
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                      <Circle className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                                    </div>
                                    <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                                      {t('dashboard.smartViews.noDate')}
                                    </h1>
                                  </>
                                )
                              : selectedList
                                ? (
                                    <>
                                      <span className="text-xl">{selectedList.icon || '📋'}</span>
                                      <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                                        {selectedList.name}
                                      </h1>
                                    </>
                                  )
                                : selectedGroup
                                  ? (
                                      <>
                                        <div
                                          className="w-3 h-3 rounded-full"
                                          style={{ backgroundColor: selectedGroup.color || '#6b7280' }}
                                        />
                                        <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                                          {selectedGroup.name}
                                        </h1>
                                      </>
                                    )
                                  : (
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
                <span className="hidden sm:inline text-xs">{t('dashboard.search')}</span>
                <kbd className="hidden sm:inline ml-1.5 px-1.5 py-0.5 text-[10px] bg-stone-100 dark:bg-stone-800 rounded">
                  {typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
                  K
                </kbd>
              </Button>
              <KeyboardShortcutsButton onClick={() => setShortcutsDialogOpen(true)} />
              <LogoutButton />
            </div>
          </div>
        </header>

        {/* Three-column layout container */}
        <div className="flex-1 flex overflow-hidden">
          {/* Center Content - always visible on mobile (Sheet overlays on top), desktop shows alongside detail panel */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 transition-all duration-300 min-w-0">
            <div className={showCalendarView ? 'h-full' : 'max-w-4xl mx-auto'}>
              {showTodayView
                ? (
                    <TodayPanel />
                  )
                : showCalendarView
                  ? (
                      <CalendarPanel
                        selectedTaskId={selectedTaskId}
                        allLists={lists}
                        filterListId={selectedListId}
                        onTaskSelect={handleTaskSelect}
                      />
                    )
                  : showInboxView
                    ? (
                        isLoadingInbox
                          ? (
                              <TaskPanelSkeleton />
                            )
                          : inboxList
                            ? (
                                <TaskPanel
                                  ref={taskPanelRef}
                                  list={inboxList}
                                  selectedTaskId={selectedTaskId}
                                  allLists={lists}
                                  allGroups={initialGroups.map(group => ({ id: group.id, name: group.name }))}
                                  isInboxMode
                                  onTaskSelect={handleTaskSelect}
                                />
                              )
                            : (
                                <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-12 text-center">
                                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                                    <Inbox className="w-8 h-8 text-stone-400" />
                                  </div>
                                  <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
                                    {t('dashboard.inboxUnavailable')}
                                  </h2>
                                  <p className="text-stone-500 dark:text-stone-400">
                                    {t('dashboard.inboxUnavailableDesc')}
                                  </p>
                                </div>
                              )
                      )
                    : showReviewView
                      ? (
                          <ReviewPanel onTaskClick={handleTaskSelect} />
                        )
                      : selectedList
                        ? (
                            <TaskPanel
                              ref={taskPanelRef}
                              list={selectedList}
                              selectedTaskId={selectedTaskId}
                              allLists={lists}
                              allGroups={initialGroups.map(group => ({ id: group.id, name: group.name }))}
                              isInboxMode={false}
                              onTaskSelect={handleTaskSelect}
                            />
                          )
                        : selectedSmartView
                          ? (
                              <TaskPanel
                                ref={taskPanelRef}
                                list={null}
                                selectedTaskId={selectedTaskId}
                                smartView={selectedSmartView}
                                onTaskSelect={handleTaskSelect}
                              />
                            )
                          : (
                              <ListPanel
                                ref={listPanelRef}
                                group={selectedGroup}
                                lists={groupLists}
                                allGroups={initialGroups}
                                onListsChange={handleListsChange}
                                onListSelect={handleListSelect}
                              />
                            )}
            </div>
          </main>

          {/* Right Detail Panel - Desktop only (large screens) */}
          <div
            className={`hidden xl:block flex-shrink-0 transition-all duration-300 ease-in-out ${
              selectedTaskId ? 'xl:w-80 2xl:w-96 opacity-100' : 'w-0 opacity-0 overflow-hidden'
            }`}
          >
            <TaskDetailPanel
              taskId={selectedTaskId}
              onTaskUpdated={handleListsChange}
              onClose={handleCloseDetail}
            />
          </div>
        </div>
      </div>

      {/* Mobile Task Detail Sheet */}
      <TaskDetailSheet
        task={null}
        taskId={selectedTaskId}
        open={mobileDetailOpen}
        onOpenChange={(open) => {
          setMobileDetailOpen(open)
          if (!open)
            setSelectedTaskId(null)
        }}
        onTaskUpdated={handleListsChange}
      />

      {/* Keyboard Shortcuts Help Dialog */}
      <KeyboardShortcutsDialog
        open={shortcutsDialogOpen}
        onOpenChange={setShortcutsDialogOpen}
      />

      {/* Search Dialog */}
      <SearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        onTaskSelect={handleSearchTaskSelect}
      />
    </div>
  )
}
