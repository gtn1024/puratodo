# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PuraToDo is a task management web application with support for infinite nested subtasks. Built with Next.js 16, React 19, and Supabase.

## Commands

```bash
./init.sh              # Install deps and start dev server (alias for npm run dev)
./init.sh --no-dev    # Only install deps, don't start server
npm run dev           # Start development server (localhost:3000)
npm run build         # Production build
npm run start         # Start production server
npm run lint          # Run ESLint
```

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, RLS)
- **Testing**: Playwright MCP (end-to-end)
- **Language**: TypeScript (strict mode)

## Data Model

Three core entities with all tables including `user_id` for RLS:

```
users (Supabase Auth)
    └── groups (categories)
            └── lists (todo lists)
                    └── tasks (todo items, self-referencing via parent_id)
```

Key fields:
- **groups**: id, user_id, name, color, sort_order
- **lists**: id, user_id, group_id, name, icon, sort_order
- **tasks**: id, user_id, list_id, parent_id (self-ref), name, completed, starred, due_date, plan_date, comment, duration_minutes, sort_order

## Development Workflow

This project follows a "long-running agent" methodology with daily progress logging:

1. Read `claude-progress.txt` - check current status and next steps
2. Read `feature_list.json` - get feature details and test steps
3. Run `./init.sh` to start dev environment
4. Implement the feature
5. Test with Playwright MCP
6. Update `feature_list.json` (set `passes: true` for completed feature)
7. Update `claude-progress.txt` (append new log for current session, what has done, what does not work, next steps)
8. Git commit

## Architecture

- **App Router**: Routes in `src/app/`, use folder-based routing
- **Server Actions**: Business logic in `src/actions/` (e.g., `src/actions/groups.ts`)
- **Components**: UI components in `src/components/`, dashboard components in `src/components/dashboard/`
- **Supabase**: Client in `src/lib/supabase/` (browser client + server client for SSR)
- **Path Alias**: `@/*` maps to `./src/*`

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Future: CalDAV Integration

- Phase includes CalDAV integration for Apple Reminders sync
- API designed for future mobile/desktop clients (iOS, Android, etc.)
