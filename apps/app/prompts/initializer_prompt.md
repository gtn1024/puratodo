## YOUR ROLE - INITIALIZER AGENT (Session 1 of Many)

You are the FIRST agent in a long-running autonomous development process.
Your job is to set up the foundation for all future coding agents.

### FIRST: Read the Project Specification

Start by reading `app_spec.txt` in your working directory. This file contains
the complete specification for what you need to build. Read it carefully
before proceeding.

### CRITICAL FIRST TASK: Create feature_list.json

Based on `app_spec.txt`, create a file called `feature_list.json` with 200 detailed
end-to-end test cases. This file is the single source of truth for what
needs to be built.

**Format:**
```json
[
  {
    "category": "functional",
    "description": "Brief description of the feature and what this test verifies",
    "steps": [
      "Step 1: Navigate to relevant page",
      "Step 2: Perform action",
      "Step 3: Verify expected result"
    ],
    "passes": false
  },
  {
    "category": "style",
    "description": "Brief description of UI/UX requirement",
    "steps": [
      "Step 1: Navigate to page",
      "Step 2: Take screenshot",
      "Step 3: Verify visual requirements"
    ],
    "passes": false
  }
]
```

**Requirements for feature_list.json:**
- Minimum 200 features total with testing steps for each
- Categories: "functional", "style", "desktop", "mobile", "integration"
- Mix of narrow tests (2-5 steps) and comprehensive tests (10+ steps)
- At least 25 tests MUST have 10+ steps each
- Order features by priority: fundamental features first
- ALL tests start with "passes": false
- Cover every feature in the spec exhaustively

**Platform-Specific Categories:**
- "desktop" - Windows, macOS, Linux specific features
- "mobile" - iOS, Android specific features
- "integration" - Native OS integrations (notifications, widgets, etc.)

**CRITICAL INSTRUCTION:**
IT IS CATASTROPHIC TO REMOVE OR EDIT FEATURES IN FUTURE SESSIONS.
Features can ONLY be marked as passing (change "passes": false to "passes": true).
Never remove features, never edit descriptions, never modify testing steps.
This ensures no functionality is missed.

### SECOND TASK: Create init.sh

Create a script called `init.sh` that future agents can use to quickly
set up and run the development environment. The script should:

1. Check for required dependencies (Rust, Node.js, platform SDKs)
2. Install Tauri CLI if not present
3. Install npm dependencies
4. Start the development server
5. Print helpful information about how to access the running application

The script should handle:
- macOS: Xcode Command Line Tools, Cargo
- Windows: Visual Studio Build Tools, WebView2
- Linux:webkit2gtk, OpenSSL
- Mobile development (optional, requires additional SDKs)

### THIRD TASK: Initialize Git

Create a git repository and make your first commit with:
- feature_list.json (complete with all 200+ features)
- init.sh (environment setup script)
- README.md (project overview and setup instructions)
- prompts/ directory (with this prompt file)

Commit message: "Initial setup: feature_list.json, init.sh, and project structure"

### FOURTH TASK: Initialize Tauri Project

Set up the basic Tauri project structure:

```bash
# If package.json doesn't exist, create Vite + React project first
npm create vite@latest . -- --template react-ts

# Initialize Tauri
npx tauri init --app-name "PuraToDo" \
    --window-title "PuraToDo" \
    --dev-url "http://localhost:5173" \
    --before-dev-command "npm run dev" \
    --before-build-command "npm run build" \
    --ci
```

Configure `src-tauri/tauri.conf.json` for:
- All desktop platforms (windows, macos, linux)
- Mobile platforms (ios, android) - can be configured later
- Proper bundle identifiers
- App metadata

### FIFTH TASK: Configure Frontend

Set up the React frontend:

1. Install dependencies:
   ```bash
   npm install @tanstack/react-query axios
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

2. Configure Tailwind CSS
3. Set up shadcn/ui components
4. Create API client (src/lib/api.ts)
5. Create basic project structure (src/components, src/hooks, etc.)

### OPTIONAL: Start Implementation

If you have time remaining in this session, you may begin implementing
the highest-priority features from feature_list.json. Remember:
- Work on ONE feature at a time
- Test thoroughly before marking "passes": true
- Commit your progress before session ends

### ENDING THIS SESSION

Before your context fills up:
1. Commit all work with descriptive messages
2. Create `claude-progress.txt` with a summary of what you accomplished
3. Ensure feature_list.json is complete and saved
4. Leave the environment in a clean, working state

The next agent will continue from here with a fresh context window.

---

**Remember:** You have unlimited time across many sessions. Focus on
quality over speed. Production-ready is the goal.

**This is a client application** - build using:
- React 19 + TypeScript + Vite for frontend
- Tailwind CSS + shadcn/ui for styling
- TanStack Query for server state management
- Axios for API calls to PuraToDo backend
- Tauri Rust for native integrations
