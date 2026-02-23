---
name: release
description: Create a version release with git tag. Updates version in both web and app packages. Triggers: "release", "bump version", "create release", "new version"
allowed-tools: Bash(git:*), Read, Edit, Write, AskUserQuestion
---

# Release Skill

This skill creates a version release for PuraToDo, updating version numbers across the monorepo and creating a git tag.

## Files Updated

The skill updates version in these files:
1. `apps/web/package.json` - Web app version
2. `apps/app/package.json` - Tauri app version
3. `apps/app/src-tauri/tauri.conf.json` - Tauri config version
4. `apps/app/src-tauri/Cargo.toml` - Rust backend version

## Workflow

### Step 1: Pre-flight Checks

1. Check git status is clean (no uncommitted changes)
   ```bash
   git status --porcelain
   ```
   If not clean, warn user and stop.

2. Check current git tags to avoid duplicates
   ```bash
   git tag -l
   ```

3. Read current version from `apps/web/package.json`

### Step 2: Determine New Version

Ask the user using AskUserQuestion:
- "What type of version release?"
  - Options: patch (0.4.0 → 0.4.1), minor (0.4.0 → 0.5.0), major (0.4.0 → 1.0.0), custom
- If custom, ask for specific version number

Calculate the new version number based on current version and selected type.

### Step 3: Show Preview

Show the user what will change:
- Current version: X.Y.Z
- New version: A.B.C
- Files to be updated:
  - apps/web/package.json
  - apps/app/package.json
  - apps/app/src-tauri/tauri.conf.json
  - apps/app/src-tauri/Cargo.toml
- Git tag to create: vA.B.C

Ask for confirmation before proceeding.

### Step 4: Update Version Files

Update all version fields:

1. **apps/web/package.json**
   - Update the "version" field in JSON

2. **apps/app/package.json**
   - Update the "version" field in JSON

3. **apps/app/src-tauri/tauri.conf.json**
   - Update the "version" field in JSON

4. **apps/app/src-tauri/Cargo.toml**
   - Update the `version = "X.Y.Z"` line
   - Format: `version = "A.B.C"` (keep quotes)

### Step 5: Create Git Commit and Tag

1. Stage all changed files
   ```bash
   git add apps/web/package.json apps/app/package.json apps/app/src-tauri/tauri.conf.json apps/app/src-tauri/Cargo.toml
   ```

2. Create commit with conventional commit format
   ```bash
   git commit -m "chore(release): bump version to A.B.C"
   ```

3. Create annotated git tag
   ```bash
   git tag -a vA.B.C -m "Release vA.B.C"
   ```

### Step 6: Post-release Summary

Show summary:
- Version updated from X.Y.Z to A.B.C
- Commit created: chore(release): bump version to A.B.C
- Tag created: vA.B.C

Remind user:
- Tags are created locally only
- To push: `git push && git push --tags`
- Vercel will auto-deploy when pushed

## Error Handling

- If git status is not clean, stop and warn user
- If tag already exists, stop and warn user
- If version format is invalid, ask again
- If any file update fails, report error and stop

## Version Calculation

Given current version X.Y.Z:
- **patch**: X.Y.(Z+1) - Bug fixes, small changes
- **minor**: X.(Y+1).0 - New features, backwards compatible
- **major**: (X+1).0.0 - Breaking changes

## Example

Current version: 0.4.0
User selects: minor
New version: 0.5.0

Files updated, commit created, tag v0.5.0 created locally.
