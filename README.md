# PuraToDo

A modern task management web application with support for infinite nested subtasks.

## Features

- **Infinite Nested Subtasks**: Create tasks within tasks without any depth limit
- **Organized Structure**: Groups (categories) → Lists → Tasks hierarchy
- **Task Properties**:
  - Due dates and plan dates
  - Star/importance marking
  - Comments and duration tracking
  - Recurring tasks support
- **Real-time Sync**: Built with Supabase for real-time data synchronization
- **Cross-platform**: Web app (Next.js) and desktop app (Tauri)

## Tech Stack

- **Web Framework**: Next.js 16 (App Router) + React 19
- **Desktop/Mobile**: Tauri 2.0 + React + Vite
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, RLS)
- **Language**: TypeScript (strict mode)
- **Package Manager**: pnpm 9+ with workspaces

## Project Structure

This is a **pnpm monorepo** with the following structure:

```
puratodo/
├── apps/
│   ├── web/                 # Next.js web application
│   └── app/                 # Tauri desktop app
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── task-ui/             # Shared business components
│   ├── api-types/           # API type definitions
│   └── shared/              # Shared utilities
├── init.sh                  # Development server startup script
└── pnpm-workspace.yaml      # Workspace configuration
```

## Self-Deployment Guide

### Prerequisites

- Node.js 18 or higher
- pnpm 9 or higher
- A Supabase account

### 1. Clone and Install

```bash
$ git clone https://github.com/gtn1024/puratodo.git
$ cd puratodo
$ pnpm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API
3. Copy your `SUPABASE_URL` and `SUPABASE_ANON_KEY`

### 3. Run Database Migrations

You can apply the database schema in two ways:

#### Option A: Using Supabase Dashboard

1. Go to your Supabase project → SQL Editor
2. Copy and run the migration files from `apps/web/supabase/migrations/` in order:
   - `20240220000000_initial_schema.sql`
   - `20260220000001_add_reminder_fields.sql`

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI if you haven't already
# https://supabase.com/docs/guides/cli

# Link your local project to your remote Supabase project
cd apps/web
supabase link --project-ref <your-project-ref>

# Push migrations to remote
supabase db push
```

### 4. Configure Environment Variables

Create `apps/web/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 5. Deploy

#### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [vercel.com](https://vercel.com)
3. Vercel will auto-detect the pnpm monorepo and configure settings
4. Add your environment variables in Vercel dashboard
5. Deploy

#### Deploy to Other Platforms

Build the application:

```bash
pnpm build:web
```

The output will be in `apps/web/.next/`. Configure your hosting platform to serve this Next.js app.

## Development Instructions

### Starting Development Server

Use the provided `init.sh` script:

```bash
./init.sh web   # Start Next.js web dev server (default)
./init.sh app   # Start Tauri desktop app
```

Or use pnpm directly:

```bash
# From monorepo root
pnpm dev              # Start web dev server
pnpm dev:web          # Start web dev server
pnpm dev:app          # Start Tauri dev mode

# Or navigate to specific app
cd apps/web
pnpm dev              # Start web dev server on :3000
```

### Building

```bash
# Build all packages
pnpm build

# Build specific app
pnpm build:web        # Build web app
pnpm build:app        # Build Tauri app
```

### Database Management

```bash
# Create new migration
pnpm db:migration:new

# Push migrations to Supabase
pnpm db:push

# Pull schema from Supabase
pnpm db:pull

# Show schema differences
pnpm db:diff
```

### Linting

```bash
pnpm lint            # Lint all packages
```

### Clean

```bash
pnpm clean           # Clean all node_modules and build artifacts
```

## Data Model

```
users (Supabase Auth)
    └── groups (categories)
            └── lists (todo lists)
                    └── tasks (todo items, self-referencing via parent_id)
```

### Key Fields

**groups**: id, user_id, name, color, sort_order
**lists**: id, user_id, group_id, name, icon, sort_order
**tasks**: id, user_id, list_id, parent_id, name, completed, starred, due_date, plan_date, comment, duration_minutes, recurrence_*, sort_order

## Acknowledgment

This project was written with assistance from AI/LLMs.

## MCP Integration

PuraToDo supports the Model Context Protocol (MCP) for integration with Claude Desktop and other AI assistants.

### Features

- **View Tasks**: Access today's tasks, overdue items, starred tasks, and more
- **Manage Tasks**: Create, update, complete, and delete tasks through natural language
- **Search**: Find tasks by name or keyword
- **Prompts**: Use pre-built prompts for common workflows

### Quick Setup

1. Navigate to **Settings** → **API Tokens** in your PuraToDo dashboard
2. Create a new token with the required scopes
3. Add the token to your Claude Desktop configuration

For detailed setup instructions, see the [MCP Setup Guide](apps/web/docs/mcp-setup.md).
