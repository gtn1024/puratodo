/**
 * Batch Task Parser
 *
 * Parses multi-line text input to extract tasks with durations and nesting levels.
 *
 * Supported formats:
 * - Durations: 30m, 45min, 1h, 1.5h, 90min, [30m], (45min), etc.
 * - Nesting: 2 spaces or tab indentation, bullet characters (-, *, •)
 * - Empty lines: ignored
 */

export interface ParsedTask {
  name: string
  durationMinutes: number | null
  level: number // 0 = root level, 1 = first subtask, etc.
  lineNumber: number
  hasError: boolean
  errorMessage?: string
}

export interface ParseResult {
  tasks: ParsedTask[]
  errors: string[]
}

/**
 * Parse duration string to minutes
 * Supports: 30m, 45min, 1h, 1.5h, 90min, [30m], (45min), {30m}
 * Requires explicit unit (m, min, h, hour)
 */
function parseDuration(text: string): number | null {
  // Remove brackets/parentheses
  const cleaned = text.trim().replace(/^[[{(]|[\]})]$/g, '')

  // Match patterns like: 30m, 45min, 1h, 1.5h, 90min
  // Require explicit unit - don't treat bare numbers as minutes
  const match = cleaned.match(/^(\d+(?:\.\d+)?)\s*(m|min|h|hour|hours|minutes?)$/i)
  if (!match) {
    return null
  }

  const value = Number.parseFloat(match[1])
  const unit = match[2]?.toLowerCase() || ''

  if (unit.startsWith('h') || unit.startsWith('hour')) {
    return Math.round(value * 60)
  }
  // Default to minutes if 'm', 'min', or 'minutes' specified
  return Math.round(value)
}

/**
 * Extract duration from task line
 * Looks for patterns like: [30m], (45min), {1h}, or trailing duration
 */
function extractDuration(line: string): { name: string, durationMinutes: number | null } {
  let name = line
  let durationMinutes: number | null = null

  // Pattern 1: Duration in brackets at end: "Task name [30m]"
  // Use indexOf for simpler parsing without regex backtracking
  const bracketStart = line.lastIndexOf('[')
  const parenStart = line.lastIndexOf('(')
  const braceStart = line.lastIndexOf('{')

  const openIndex = Math.max(bracketStart, parenStart, braceStart)
  if (openIndex >= 0) {
    const char = line[openIndex]
    const closeChar = char === '[' ? ']' : char === '(' ? ')' : '}'
    const closeIndex = line.lastIndexOf(closeChar)

    if (closeIndex > openIndex) {
      const durationStr = line.substring(openIndex + 1, closeIndex).trim()
      const parsedDuration = parseDuration(durationStr)

      if (parsedDuration !== null) {
        name = line.substring(0, openIndex).trim()
        durationMinutes = parsedDuration
      }
    }
  }

  // Pattern 2: Trailing duration without brackets: "Task name 30m"
  // Only if we didn't find a bracketed duration
  if (durationMinutes === null) {
    // Match patterns at the end of the line: number followed by optional unit
    // Use a simple approach - split by spaces and check the last part
    const parts = line.trim().split(/\s+/)
    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1]
      const trailingDuration = parseDuration(lastPart)

      if (trailingDuration !== null) {
        name = parts.slice(0, -1).join(' ')
        durationMinutes = trailingDuration
      }
    }
  }

  return { name, durationMinutes }
}

/**
 * Detect indentation level (number of leading spaces/tabs)
 * 2 spaces or 1 tab = 1 level
 */
function detectIndentLevel(line: string): number {
  const spacesMatch = line.match(/^(\s*)/)
  const whitespace = spacesMatch ? spacesMatch[1] : ''

  // Count tabs as 1 level each
  const tabCount = (whitespace.match(/\t/g) || []).length

  // Count spaces (2 spaces = 1 level)
  const spaceCount = whitespace.replace(/\t/g, '').length
  const levelFromSpaces = Math.floor(spaceCount / 2)

  return tabCount + levelFromSpaces
}

/**
 * Check if line is a bullet item
 */
function isBulletLine(line: string): boolean {
  const trimmed = line.trim()
  return /^[-*•]\s/.test(trimmed)
}

/**
 * Remove bullet character from line if present
 */
function removeBullet(line: string): string {
  const trimmed = line.trim()
  if (isBulletLine(trimmed)) {
    return trimmed.replace(/^[-*•]\s+/, '')
  }
  return line
}

/**
 * Parse multi-line input into structured tasks
 */
export function parseBatchTasks(input: string): ParseResult {
  const lines = input.split('\n')
  const tasks: ParsedTask[] = []
  const errors: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNumber = i + 1

    // Skip empty lines
    if (!line.trim()) {
      continue
    }

    // Remove bullet character if present
    const lineWithoutBullet = removeBullet(line)

    // Detect indentation level
    const level = detectIndentLevel(line)

    // Extract duration and name
    const { name, durationMinutes } = extractDuration(lineWithoutBullet)

    // Validate
    const hasError = !name.trim()
    const errorMessage = hasError ? `Line ${lineNumber}: Task name cannot be empty` : undefined

    if (errorMessage) {
      errors.push(errorMessage)
    }

    tasks.push({
      name: name.trim(),
      durationMinutes,
      level,
      lineNumber,
      hasError,
      errorMessage,
    })
  }

  // Validate nesting levels (should increase by at most 1 at a time)
  let previousLevel = -1
  for (const task of tasks) {
    if (previousLevel >= 0 && task.level > previousLevel + 1) {
      const error = `Line ${task.lineNumber}: Invalid nesting (jumped from level ${previousLevel} to ${task.level})`
      task.hasError = true
      task.errorMessage = error
      errors.push(error)
    }
    previousLevel = task.level
  }

  return { tasks, errors }
}

/**
 * Convert parsed tasks to a tree structure for preview
 */
export interface TaskTreeItem extends ParsedTask {
  children: TaskTreeItem[]
}

export function buildTaskTree(tasks: ParsedTask[]): TaskTreeItem[] {
  const root: TaskTreeItem[] = []
  const stack: TaskTreeItem[] = []

  for (const task of tasks) {
    const item: TaskTreeItem = {
      ...task,
      children: [],
    }

    // Find the parent based on level
    while (stack.length > task.level) {
      stack.pop()
    }

    if (stack.length === 0) {
      root.push(item)
    }
    else {
      stack[stack.length - 1].children.push(item)
    }

    stack.push(item)
  }

  return root
}
