'use client'

import type { TaskWithSubtasks } from '@puratodo/api-types'
import type { RecurrenceEditorValue, RecurrenceUpdateScope, TaskUpdatePayload } from './TaskDetailForm'
import { RecurrenceEditor } from './RecurrenceEditor'
import { ReminderEditor } from './ReminderEditor'
import {
  createRecurrenceEditorValue,

  TaskDetailForm,

} from './TaskDetailForm'

/**
 * Comprehensive labels for TaskDetailDrawer
 * Includes labels for TaskDetailForm, RecurrenceEditor, and ReminderEditor
 */
export interface TaskDetailDrawerLabels {
  // TaskDetailForm labels
  taskName: string
  taskNamePlaceholder: string
  dueDate: string
  planDate: string
  duration: string
  durationPlaceholder: string
  url: string
  urlPlaceholder: string
  openUrl: string
  comment: string
  commentPlaceholder: string
  selectDueDate: string
  selectPlanDate: string
  clear: string
  save: string
  cancel: string
  loading: string
  taskNotFound: string

  // RecurrenceEditor labels
  recurrence: string
  recurrenceNone: string
  recurrenceDaily: string
  recurrenceWeekly: string
  recurrenceMonthly: string
  recurrenceCustom: string
  every: string
  intervalUnitDays: string
  intervalUnitWeeks: string
  intervalUnitMonths: string
  weekdays: string
  weekdaySun: string
  weekdayMon: string
  weekdayTue: string
  weekdayWed: string
  weekdayThu: string
  weekdayFri: string
  weekdaySat: string
  customRule: string
  customRulePlaceholder: string
  timezone: string
  timezonePlaceholder: string
  end: string
  endNever: string
  endOnDate: string
  endAfterCount: string
  selectEndDate: string
  applyScope: string
  scopeSingle: string
  scopeFuture: string

  // ReminderEditor labels
  reminderTitle: string
  reminderClear: string
  reminderNotSupported: string
  reminderDenied: string
  reminderEnable: string
  reminderSelectPreset: string
  reminderPresetsNone: string
  reminderPresetsAtTime: string
  reminderPresets5min: string
  reminderPresets15min: string
  reminderPresets30min: string
  reminderPresets1hour: string
  reminderPresets1day: string
  reminderPresetsCustom: string
  reminderWillRemindAt: string
  reminderNoDateWarning: string
}

export interface TaskDetailDrawerProps {
  /** The task to display/edit */
  task: TaskWithSubtasks | null
  /** Loading state */
  isLoading?: boolean
  /** Callback when save is clicked */
  onSave: (updates: TaskUpdatePayload) => Promise<void>
  /** Callback when cancel is clicked */
  onCancel: () => void
  /** Callback to open URL */
  onOpenUrl?: (url: string) => void

  // Recurrence state (controlled)
  recurrence: RecurrenceEditorValue
  onRecurrenceChange: (value: RecurrenceEditorValue) => void
  recurrenceScope: RecurrenceUpdateScope
  onRecurrenceScopeChange: (scope: RecurrenceUpdateScope) => void

  // Reminder state (controlled)
  remindAt: string | null
  onRemindAtChange: (remindAt: string | null) => void

  /** Comprehensive labels for i18n */
  labels: TaskDetailDrawerLabels
}

/**
 * TaskDetailDrawer - A shared task detail form with Recurrence and Reminder editors
 *
 * This component wraps TaskDetailForm with RecurrenceEditor and ReminderEditor
 * already injected. It provides a comprehensive labels interface for i18n.
 *
 * Usage:
 * ```tsx
 * <TaskDetailDrawer
 *   task={task}
 *   isLoading={loading}
 *   onSave={handleSave}
 *   onCancel={handleCancel}
 *   recurrence={recurrence}
 *   onRecurrenceChange={setRecurrence}
 *   recurrenceScope={scope}
 *   onRecurrenceScopeChange={setScope}
 *   remindAt={remindAt}
 *   onRemindAtChange={setRemindAt}
 *   labels={labels}
 * />
 * ```
 */
export function TaskDetailDrawer({
  task,
  isLoading,
  onSave,
  onCancel,
  onOpenUrl,
  recurrence,
  onRecurrenceChange,
  recurrenceScope,
  onRecurrenceScopeChange,
  remindAt,
  onRemindAtChange,
  labels,
}: TaskDetailDrawerProps) {
  // Create wrapped RecurrenceEditor with labels pre-injected
  const RecurrenceEditorComponent = (props: {
    value: RecurrenceEditorValue
    onChange: (value: RecurrenceEditorValue) => void
    updateScope: RecurrenceUpdateScope
    onUpdateScopeChange: (scope: RecurrenceUpdateScope) => void
  }) => (
    <RecurrenceEditor
      {...props}
      labels={{
        recurrence: labels.recurrence,
        recurrenceNone: labels.recurrenceNone,
        recurrenceDaily: labels.recurrenceDaily,
        recurrenceWeekly: labels.recurrenceWeekly,
        recurrenceMonthly: labels.recurrenceMonthly,
        recurrenceCustom: labels.recurrenceCustom,
        clear: labels.clear,
        every: labels.every,
        intervalUnitDays: labels.intervalUnitDays,
        intervalUnitWeeks: labels.intervalUnitWeeks,
        intervalUnitMonths: labels.intervalUnitMonths,
        weekdays: labels.weekdays,
        weekdaySun: labels.weekdaySun,
        weekdayMon: labels.weekdayMon,
        weekdayTue: labels.weekdayTue,
        weekdayWed: labels.weekdayWed,
        weekdayThu: labels.weekdayThu,
        weekdayFri: labels.weekdayFri,
        weekdaySat: labels.weekdaySat,
        customRule: labels.customRule,
        customRulePlaceholder: labels.customRulePlaceholder,
        timezone: labels.timezone,
        timezonePlaceholder: labels.timezonePlaceholder,
        end: labels.end,
        endNever: labels.endNever,
        endOnDate: labels.endOnDate,
        endAfterCount: labels.endAfterCount,
        selectEndDate: labels.selectEndDate,
        applyScope: labels.applyScope,
        scopeSingle: labels.scopeSingle,
        scopeFuture: labels.scopeFuture,
      }}
    />
  )

  // Create wrapped ReminderEditor with labels pre-injected
  const ReminderEditorComponent = (props: {
    remindAt: string | null
    dueDate: string | null
    planDate: string | null
    onChange: (value: { remindAt: string | null }) => void
  }) => (
    <ReminderEditor
      {...props}
      labels={{
        title: labels.reminderTitle,
        clear: labels.reminderClear,
        notSupported: labels.reminderNotSupported,
        denied: labels.reminderDenied,
        enable: labels.reminderEnable,
        selectPreset: labels.reminderSelectPreset,
        presetsNone: labels.reminderPresetsNone,
        presetsAtTime: labels.reminderPresetsAtTime,
        presets5min: labels.reminderPresets5min,
        presets15min: labels.reminderPresets15min,
        presets30min: labels.reminderPresets30min,
        presets1hour: labels.reminderPresets1hour,
        presets1day: labels.reminderPresets1day,
        presetsCustom: labels.reminderPresetsCustom,
        willRemindAt: labels.reminderWillRemindAt,
        noDateWarning: labels.reminderNoDateWarning,
      }}
    />
  )

  return (
    <TaskDetailForm
      task={task}
      isLoading={isLoading}
      onSave={onSave}
      onCancel={onCancel}
      onOpenUrl={onOpenUrl}
      recurrence={recurrence}
      onRecurrenceChange={onRecurrenceChange}
      recurrenceScope={recurrenceScope}
      onRecurrenceScopeChange={onRecurrenceScopeChange}
      remindAt={remindAt}
      onRemindAtChange={onRemindAtChange}
      labels={{
        taskName: labels.taskName,
        taskNamePlaceholder: labels.taskNamePlaceholder,
        dueDate: labels.dueDate,
        planDate: labels.planDate,
        duration: labels.duration,
        durationPlaceholder: labels.durationPlaceholder,
        url: labels.url,
        urlPlaceholder: labels.urlPlaceholder,
        openUrl: labels.openUrl,
        comment: labels.comment,
        commentPlaceholder: labels.commentPlaceholder,
        selectDueDate: labels.selectDueDate,
        selectPlanDate: labels.selectPlanDate,
        clear: labels.clear,
        save: labels.save,
        cancel: labels.cancel,
        loading: labels.loading,
        taskNotFound: labels.taskNotFound,
      }}
      RecurrenceEditor={RecurrenceEditorComponent}
      ReminderEditor={ReminderEditorComponent}
    />
  )
}

// Re-export helper function and types for convenience
export { createRecurrenceEditorValue }
