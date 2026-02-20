# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PuraToDo is a task management web application with support for infinite nested subtasks. Built with Next.js 16, React 19, and Supabase.

## Monorepo Structure

This project uses **pnpm workspaces** for monorepo management:

```
puratodo/
├── apps/
│   ├── web/                 # Next.js web application (@puratodo/web)
│   │   ├── src/             # App source code
│   │   ├── public/          # Static assets
│   │   ├── supabase/        # Database migrations
│   │   └── package.json
│   └── app/                 # Tauri desktop app (@puratodo/app)
│       ├── src/             # React frontend (Vite)
│       ├── src-tauri/       # Tauri Rust backend
│       ├── package.json
│       └── app_spec.txt
├── packages/
│   ├── ui/                  # Shared UI components (@puratodo/ui)
│   ├── api-types/           # API type definitions (@puratodo/api-types)
│   └── shared/              # Shared utilities (@puratodo/shared)
├── pnpm-workspace.yaml      # Workspace configuration
├── package.json             # Root package with scripts
└── tsconfig.base.json       # Shared TypeScript config
```

## Commands

```bash
# Run from monorepo root
pnpm dev              # Start development server (apps/web)
pnpm build            # Build all packages
pnpm build:web        # Build web app only
pnpm lint             # Lint all packages
pnpm clean            # Clean all node_modules and build artifacts

# Package-specific commands
pnpm --filter @puratodo/web dev       # Start web dev server
pnpm --filter @puratodo/web build     # Build web app
pnpm --filter @puratodo/ui build      # Build UI package

# Database (runs in apps/web context)
pnpm db:migration:new   # Create new migration
pnpm db:push            # Push migrations to Supabase
pnpm db:pull            # Pull schema from Supabase
pnpm db:diff            # Show schema differences

# Tauri app (apps/app)
cd apps/app && npm run tauri dev      # Start Tauri dev mode
cd apps/app && npm run tauri build   # Build for production
```

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, RLS)
- **Testing**: Playwright MCP (end-to-end)
- **Language**: TypeScript (strict mode)
- **Package Manager**: pnpm 9+ with workspaces

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
2. Read `feature_list.json` - get feature details and test steps. Note that one step MUST do one task, unless it's very small or closely related to another step. If a step is too big, break it down into smaller steps.
3. Run `pnpm dev` to start dev environment
4. Implement the feature
5. Test with Playwright MCP (the credentials of accounts in `.credentials.local`)
6. Make sure project can be built successfully (`pnpm build:web`)
7. Update `feature_list.json` (set `passes: true` for completed feature)
8. Update `claude-progress.txt` (append new log for current session, what has done, what does not work, next steps)
9. Git commit

**NOTE:**

1. Always keep `claude-progress.txt` and `feature_list.json` up to date. These are critical for tracking progress and guiding future development.
2. ALWAYS get ONLY ONE task from `feature_list.json` at a time. This ensures focused development and accurate progress tracking. If you find a task that is too large, let me know!

## Apps Overview

### apps/web (Next.js Web App)
- Primary web application
- Uses root `feature_list.json` and `claude-progress.txt`
- Target: Browser, Vercel deployment

### apps/app (Tauri Desktop App)
- Cross-platform desktop/mobile app (Tauri 2.0)
- Has **separate** `feature_list.json` (209 test cases) and `claude-progress.txt`
- Target: Desktop (macOS, Windows, Linux), Mobile (iOS, Android)
- Connects to web app's API backend

## Architecture

- **App Router**: Routes in `apps/web/src/app/`, use folder-based routing
- **Server Actions**: Business logic in `apps/web/src/actions/` (e.g., `src/actions/groups.ts`)
- **Components**: UI components in `apps/web/src/components/`, dashboard components in `apps/web/src/components/dashboard/`
- **Supabase**: Client in `apps/web/src/lib/supabase/` (browser client + server client for SSR)
- **Path Alias**: `@/*` maps to `./src/*` (in apps/web)
- **Workspace Packages**: Import as `@puratodo/ui`, `@puratodo/api-types`, `@puratodo/shared`

## Environment Variables

Required in `apps/web/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Vercel Deployment

Vercel automatically detects pnpm monorepo via `pnpm-workspace.yaml`:

- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: Leave empty (auto-detects apps/web)
- **Build Command**: `pnpm build` (or leave auto)
- **Install Command**: `pnpm install` (auto-detected)

The `apps/web/vercel.json` file configures the build command for monorepo context.
