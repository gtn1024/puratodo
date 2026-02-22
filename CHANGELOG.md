# Changelog

All notable changes to this project will be documented in this file.

## [0.3.1] - 2026-02-22

### Added
- **Enhanced i18n Support**: Comprehensive internationalization for core components
  - LoginPage: Full i18n support for labels, buttons, placeholders, and error messages
  - RegisterPage: Complete form internationalization
  - CalendarPanel: Month names, weekday names, and all UI text internationalized
  - App component: Loading state internationalized
  - TaskDetailPanel: All field labels, buttons, and empty states internationalized
  - AccountSwitcher: Menu items and account management text internationalized

### Changed
- Expanded translation files with new keys:
  - `apiServer.*` - API server configuration
  - `account.*` - Multi-account management
  - `app.*` - Application common text
  - `months.*` - Month names (January-December)
  - `weekdays.short.*` - Weekday abbreviations (Sun-Sat)
  - `colors.*` - Color names for groups
  - `confirmDialogs.*` - Confirmation dialog messages
  - `emptyStates.*` - Empty state prompts
  - `login.*` - Login page specific text
  - `register.*` - Registration page specific text
  - `taskDetail.*` - Task detail panel text

### Technical Details
- i18n architecture: React Context + Hook pattern
- Translation files: `apps/app/src/messages/en.json` and `zh.json`
- Usage pattern: `const { t } = useI18n()` → `t("key.subkey")`
- Supported languages: English (en) and Chinese (zh)

## [0.3.0] - 2026-02-22

### Added
- Calendar feature with month view
- Calendar backend API endpoints for date-range and unscheduled tasks
- Calendar shared components (TaskChip, DateCell, UnscheduledTaskList)
- Calendar panel with responsive layout
- Multi-account support with account switching
- Local notifications for task reminders
- API server configuration for custom backends

### Features
- Infinite nested subtasks support
- Smart views (Today, Starred, Overdue, Next 7 Days, No Date)
- Global search across all tasks
- Dark/light theme with system preference detection
- Responsive three-column layout
- Real-time sync across devices

## [0.2.0] - Previous Release

Initial release with core task management features.
