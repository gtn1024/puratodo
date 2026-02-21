// Components barrel export
export { TaskItem } from "./TaskItem";
export type {
  TaskItemProps,
  TaskContextMeta,
  InboxMoveTarget,
} from "./TaskItem";

export { TaskList } from "./TaskList";
export type { TaskListProps } from "./TaskList";

export { TaskDetailForm, createRecurrenceEditorValue, toLocalDateString } from "./TaskDetailForm";
export type {
  TaskDetailFormProps,
  TaskUpdatePayload,
  RecurrenceFrequency,
  RecurrenceEndType,
  RecurrenceUpdateScope,
  RecurrenceEditorValue,
} from "./TaskDetailForm";

export {
  TaskFilters,
  filterTasksByFilterValue,
  hasActiveFilterValues,
} from "./TaskFilters";
export type {
  TaskFiltersValue,
  TaskFiltersProps,
  StatusFilter,
  StarFilter,
  DateFilter,
} from "./TaskFilters";

export { TaskBulkActions } from "./TaskBulkActions";
export type { TaskBulkActionsProps } from "./TaskBulkActions";

export { RecurrenceEditor } from "./RecurrenceEditor";
export type { RecurrenceEditorProps } from "./RecurrenceEditor";

export { ReminderEditor } from "./ReminderEditor";
export type { ReminderEditorProps, ReminderEditorValue, ReminderPreset } from "./ReminderEditor";

export { Sidebar } from "./Sidebar";
export type {
  SidebarProps,
  SidebarLabels,
  Group,
  List,
  SmartView,
} from "./Sidebar";

export { CommandPalette } from "./CommandPalette";
export type {
  CommandPaletteProps,
  CommandPaletteLabels,
  SearchResult,
} from "./CommandPalette";
