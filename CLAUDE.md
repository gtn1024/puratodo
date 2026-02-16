# CLAUDE.md

This file provides guidance to Claude Code when working with this project.

## Project Overview

PuraToDo is a cross-platform native task management application built with Tauri 2.0.
It supports infinite nested subtasks and targets:
- Desktop: Windows, macOS, Linux
- Mobile: iOS, Android

This is a **client application** that connects to the PuraToDo API backend.

## Long-Running Agent Framework

This project follows Anthropic's long-running agent methodology:
https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents

### Key Files

1. **app_spec.txt** - Complete project specification
2. **feature_list.json** - 200+ test cases (single source of truth)
3. **claude-progress.txt** - Progress log across sessions
4. **init.sh** - Development environment setup script
5. **prompts/** - Agent prompts (initializer and coding)

### Agent Types

1. **Initializer Agent** (first session only):
   - Reads app_spec.txt
   - Generates feature_list.json with 200+ test cases
   - Initializes Tauri project
   - Creates initial git commit

2. **Coding Agent** (subsequent sessions):
   - Reads progress and git history
   - Implements ONE feature at a time
   - Tests thoroughly before marking passing
   - Updates progress and commits

## Development Workflow

### 核心原则

1. **一次只做一个任务** - 从 feature_list.json 取一个测试，做完再取下一个
2. **先验证再标记** - 只有实际测试通过才能把 `passes` 改成 `true`
3. **保持进度更新** - claude-progress.txt 是跨会话的关键上下文

### 开发步骤

```
1. 读取 claude-progress.txt     → 了解当前状态和下一步
2. 读取 feature_list.json       → 找一个 passes: false 的测试
3. 实现/修复代码
4. 测试验证：
   - npm run build 构建通过
   - 用 Playwright MCP 或手动测试功能
5. 更新 feature_list.json       → 只改 passes 字段
6. 更新 claude-progress.txt     → 记录做了什么、遇到什么问题
7. git commit
```

### 测试账号

`.credentials.local` 文件中有测试账号，用于登录测试。

### 常用命令

```bash
npm run tauri dev      # 启动开发环境
npm run build          # 构建检查 TypeScript 错误
./init.sh              # 完整环境初始化
```

### 注意事项

- 后端 API 需要运行在 localhost:3000
- 浏览器测试会有 CORS 问题，实际 Tauri webview 中不会有
- 如果任务太大，告诉用户拆分

### Running the App

```bash
./init.sh              # Setup and start dev server
./init.sh --no-dev     # Only install deps
./init.sh --check      # Check dependencies only

# Or manually:
npm run tauri dev      # Start Tauri dev mode
npm run tauri build    # Build for production
```

## Technology Stack

- **Framework**: Tauri 2.0
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Backend**: Connects to PuraToDo API
- **Auth**: PuraToDo authentication
- **i18n**: react-i18next (internationalization)

## Test Credentials

Test account credentials are available in `.credentials.local`:
- Email: `foo@example.com`
- Password: `123456`

Use these credentials for manual testing and E2E tests.

## Tauri Commands

### Development
```bash
npm run tauri dev                    # Start dev server
npm run tauri dev -- --target ios    # iOS development
npm run tauri dev -- --target android # Android development
```

### Build
```bash
npm run tauri build                  # Build for current platform
npm run tauri build -- --target ios  # Build iOS
npm run tauri build -- --target android # Build Android
```

## Project Structure

```
./ (project root)
├── src/                  # React frontend (Vite)
├── src-tauri/            # Tauri Rust backend
│   ├── src/
│   │   ├── main.rs       # Entry point
│   │   └── lib.rs        # App logic
│   ├── Cargo.toml        # Rust dependencies
│   └── tauri.conf.json   # Tauri configuration
├── app_spec.txt          # Project specification
├── feature_list.json     # 200+ test cases
├── claude-progress.txt   # Progress log
├── init.sh               # Setup script
├── CLAUDE.md             # This file
├── agent.py              # Autonomous agent loop
└── prompts/              # Agent prompts
```

## Data Model

(Client-side view - data comes from PuraToDo API)

```
users (via API auth)
    └── groups (categories)
            └── lists (todo lists)
                    └── tasks (self-referencing via parent_id for subtasks)
```

Key fields:
- **groups**: id, user_id, name, color, sort_order
- **lists**: id, user_id, group_id, name, icon, sort_order
- **tasks**: id, user_id, list_id, parent_id (self-ref), name, completed, starred, due_date, plan_date, comment, duration_minutes, sort_order

## feature_list.json Rules

**CRITICAL RULES:**
1. NEVER remove tests
2. NEVER edit test descriptions
3. NEVER modify test steps
4. ONLY change `passes: false` to `passes: true`
5. Mark passing ONLY after actual verification

## Platform Priorities

1. **Desktop** (macOS, Windows, Linux) - Higher priority
2. **Mobile** (iOS, Android) - Can be developed later

## Environment Requirements

### All Platforms
- Node.js 18+
- Rust (via rustup)
- npm or pnpm

### macOS
- Xcode Command Line Tools: `xcode-select --install`
- For iOS: Full Xcode + iOS SDK

### Windows
- Visual Studio Build Tools (C++ workload)
- WebView2 (usually pre-installed)

### Linux
- webkit2gtk-4.1
- OpenSSL
- See Tauri docs for distro-specific packages

## Important Notes

1. **One feature at a time** - Complete one feature fully before starting another
2. **Test before marking passing** - Never assume code works without verification
3. **Keep progress updated** - claude-progress.txt is critical for context
4. **Commit often** - Descriptive commits help future sessions
5. **Platform testing** - Test on target platforms when possible
6. **i18n from the start** - All user-facing strings should use i18n from the beginning

## i18n (Internationalization)

This app supports multiple languages using react-i18next.

### Setup
- All user-facing text must be wrapped in `t('key')` calls
- Language files are stored in `src/i18n/locales/`
- Supported languages: English (en), Chinese (zh)

### Usage
```tsx
import { useTranslation } from 'react-i18next';

function Component() {
  const { t } = useTranslation();
  return <h1>{t('welcome')}</h1>;
}
```
