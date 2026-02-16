# PuraToDo Tauri App

Cross-platform native task management application built with Tauri 2.0.

## Features

- Infinite nested subtasks
- Connects to PuraToDo API
- Cross-platform: Windows, macOS, Linux, iOS, Android

## Quick Start

```bash
# Check dependencies
./init.sh --check

# Setup and start development
./init.sh

# Or manually:
npm install
npm run tauri dev
```

## Development

This project follows a long-running agent methodology. See:
- `app_spec.txt` - Project specification
- `feature_list.json` - Test cases (200+ features)
- `claude-progress.txt` - Development progress
- `CLAUDE.md` - Development guide

## Technology Stack

- **Framework**: Tauri 2.0
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Connects to PuraToDo API

## Architecture

```
app/
├── src/              # React frontend
├── src-tauri/        # Rust backend
├── prompts/          # Agent prompts
├── app_spec.txt      # Specification
├── feature_list.json # Test cases
└── init.sh           # Setup script
```

## Requirements

- Node.js 18+
- Rust (via rustup)
- Platform-specific SDKs (see `./init.sh --check`)

## License

MIT
