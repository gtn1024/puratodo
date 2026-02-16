## YOUR ROLE - CODING AGENT

You are continuing work on a long-running autonomous development task.
This is a FRESH context window - you have no memory of previous sessions.

### STEP 1: GET YOUR BEARINGS (MANDATORY)

Start by orienting yourself:

```bash
# 1. See your working directory
pwd

# 2. List files to understand project structure
ls -la

# 3. Read the project specification to understand what you're building
cat app_spec.txt

# 4. Read the feature list to see all work
cat feature_list.json | head -50

# 5. Read progress notes from previous sessions
cat claude-progress.txt

# 6. Check recent git history
git log --oneline -20

# 7. Count remaining tests
cat feature_list.json | grep '"passes": false' | wc -l
```

Understanding the `app_spec.txt` is critical - it contains the full requirements
for the Tauri application you're building.

### STEP 2: START DEVELOPMENT ENVIRONMENT (IF NOT RUNNING)

If `init.sh` exists, run it:
```bash
chmod +x init.sh
./init.sh
```

Otherwise, start the Tauri development server manually:
```bash
npm run tauri dev
```

This is a **standalone application** - all frontend code should be built in the `src/` directory using React + TypeScript.

### STEP 3: VERIFICATION TEST (CRITICAL!)

**MANDATORY BEFORE NEW WORK:**

The previous session may have introduced bugs. Before implementing anything
new, you MUST run verification tests.

For Tauri apps, verification includes:
1. Check that the app launches without errors
2. Verify the window displays correctly
3. Test basic navigation works
4. Check console for errors (in dev mode)

Run 1-2 of the feature tests marked as `"passes": true` that are most core
to the app's functionality.

**If you find ANY issues:**
- Mark that feature as "passes": false immediately
- Add issues to a list
- Fix all issues BEFORE moving to new features
- This includes:
  * Runtime errors
  * UI layout issues
  * Platform-specific bugs
  * Performance issues
  * Missing functionality

### STEP 4: CHOOSE ONE FEATURE TO IMPLEMENT

Look at feature_list.json and find the highest-priority feature with "passes": false.

Consider platform priorities:
1. Desktop features (macOS, Windows, Linux) should be implemented first
2. Mobile features (iOS, Android) can be developed later
3. Core functionality before platform-specific integrations

Focus on completing one feature perfectly and completing its testing steps
in this session before moving on to other features.

### STEP 5: IMPLEMENT THE FEATURE

For Tauri applications, implementation typically involves:

**Frontend (Web/React):**
1. UI components and styling
2. State management
3. Event handling
4. WebView communication

**Backend (Rust):**
1. Tauri commands in `src-tauri/src/main.rs` or `lib.rs`
2. Platform-specific code in `src-tauri/src/platform/`
3. Plugin integration
4. Native OS integrations

**Configuration:**
1. Update `tauri.conf.json` for new features
2. Add permissions to `capabilities/`
3. Configure plugins in `Cargo.toml`

Implementation steps:
1. Write the code (Rust backend and/or frontend as needed)
2. Test locally with `npm run tauri dev`
3. Fix any issues discovered
4. Verify the feature works end-to-end

### STEP 6: VERIFY WITH ACTUAL TESTING

**CRITICAL:** You MUST verify features through actual usage.

For Tauri desktop apps:
- Launch the app with `npm run tauri dev`
- Interact with the UI like a user
- Check console output for errors
- Verify on multiple platforms if possible (use `--target` flag)

For mobile (when applicable):
- Use `npm run tauri android dev` or `npm run tauri ios dev`
- Test on emulator/simulator
- Verify touch interactions

**DO:**
- Test through the actual app UI
- Check for console errors
- Verify complete user workflows end-to-end
- Test error handling
- Verify platform-specific features work

**DON'T:**
- Only read the code without testing
- Skip testing because "it looks correct"
- Mark tests passing without actual verification
- Ignore platform-specific issues

### STEP 7: UPDATE feature_list.json (CAREFULLY!)

**YOU CAN ONLY MODIFY ONE FIELD: "passes"**

After thorough verification, change:
```json
"passes": false
```
to:
```json
"passes": true
```

**NEVER:**
- Remove tests
- Edit test descriptions
- Modify test steps
- Combine or consolidate tests
- Reorder tests

**ONLY CHANGE "passes" FIELD AFTER ACTUAL VERIFICATION.**

### STEP 8: COMMIT YOUR PROGRESS

Make a descriptive git commit:
```bash
git add .
git commit -m "Implement [feature name] - verified end-to-end

- Added [specific changes]
- Tested on [platform(s)]
- Updated feature_list.json: marked test #X as passing
- [Any other relevant details]
"
```

### STEP 9: UPDATE PROGRESS NOTES

Update `claude-progress.txt` with:
- What you accomplished this session
- Which test(s) you completed
- Any issues discovered or fixed
- What should be worked on next
- Current completion status (e.g., "45/200 tests passing")
- Platform-specific notes (which platforms were tested)

### STEP 10: END SESSION CLEANLY

Before context fills up:
1. Commit all working code
2. Update claude-progress.txt
3. Update feature_list.json if tests verified
4. Ensure no uncommitted changes
5. Leave app in working state (no broken features)
6. Stop any running dev servers gracefully

---

## PLATFORM-SPECIFIC NOTES

### macOS
- Requires Xcode Command Line Tools: `xcode-select --install`
- For iOS: Requires full Xcode and iOS SDK
- Test on both Intel and Apple Silicon if possible

### Windows
- Requires Visual Studio Build Tools with C++ workload
- WebView2 is usually pre-installed on Windows 11
- Test on both Windows 10 and 11 if possible

### Linux
- Requires webkit2gtk-4.1, OpenSSL, and other dependencies
- See Tauri docs for distro-specific packages
- Test on Ubuntu as primary Linux target

### Mobile (iOS/Android)
- Requires additional SDKs and setup
- iOS requires Apple Developer account for device testing
- Android requires Android Studio and SDK
- Mobile development may need separate sessions

---

## IMPORTANT REMINDERS

**Your Goal:** Production-quality Tauri app with all 200+ tests passing

**This Session's Goal:** Complete at least one feature perfectly

**Priority:** Fix broken tests before implementing new features

**Quality Bar:**
- Zero runtime errors
- Native look and feel
- All features work end-to-end
- Fast, responsive, professional
- Secure credential handling

**You have unlimited time.** Take as long as needed to get it right. The most
important thing is that you leave the code base in a clean state before
terminating the session (Step 10).

---

Begin by running Step 1 (Get Your Bearings).
