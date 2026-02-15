# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PuraToDo is a task management web application with support for infinite nested subtasks. Built with Next.js 16, React 19, and Supabase.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, RLS)
- **Testing**: Playwright MCP (end-to-end)
- **Language**: TypeScript (strict mode)

## Data Model

Three core entities with all tables including `user_id` for RLS simplicity:

```
users (Supabase Auth)
    └── groups (categories)
            └── lists (todo lists)
                    └── tasks (todo items, self-referencing via parent_id)
```

Task supports infinite nesting via `parent_id` → `tasks.id` self-reference.

## Development Workflow

This project follows the "long-running agent" methodology:

1. Read `claude-progress.txt` for current state
2. Read `feature_list.json` for next feature
3. Run `./init.sh` to start dev environment
4. Implement single feature
5. Test with Playwright MCP
6. Update `feature_list.json` (set `passes: true`)
7. Update `claude-progress.txt`
8. Git commit

## Path Aliases

`@/*` maps to `./src/*` (configured in tsconfig.json)

## Future: Multi-Platform & CalDAV

- Phase 9 includes CalDAV integration for Apple Reminders sync
- API designed for future mobile/desktop clients (iOS, Android, etc.)
