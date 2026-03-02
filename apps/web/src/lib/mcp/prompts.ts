import type { MCPPrompt, PromptGetResult } from './types'

/**
 * Available MCP Prompts
 *
 * These prompts provide templates that MCP clients can use to interact
 * with the PuraToDo system in a structured way.
 */
export const prompts: MCPPrompt[] = [
  {
    name: 'today_tasks',
    description: 'Get a summary of today\'s tasks and help prioritize them',
    arguments: [],
  },
  {
    name: 'overdue_tasks',
    description: 'Review overdue tasks and plan how to handle them',
    arguments: [],
  },
  {
    name: 'weekly_review',
    description: 'Show me tasks for this week: today, upcoming, and overdue. Give me a summary.',
    arguments: [],
  },
  {
    name: 'add_task',
    description: 'Add a new task to a list',
    arguments: [
      {
        name: 'task_name',
        description: 'The name of the task to add',
        required: true,
      },
      {
        name: 'due_date',
        description: 'Optional due date for the task',
        required: false,
      },
    ],
  },
  {
    name: 'search_and_complete',
    description: 'Search for tasks by keyword and offer to complete them',
    arguments: [
      {
        name: 'query',
        description: 'The search query to find matching tasks',
        required: true,
      },
    ],
  },
]

/**
 * Get a prompt by name with optional argument interpolation
 *
 * @param name - The prompt name
 * @param args - Optional arguments to interpolate into the prompt
 * @returns Prompt get result with messages
 */
export function getPrompt(
  name: string,
  args?: Record<string, string>,
): PromptGetResult {
  switch (name) {
    case 'today_tasks':
      return {
        description: 'Get a summary of today\'s tasks and help prioritize them',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'Please read my tasks for today using the puratodo://tasks/today resource. Then:\n1. Summarize what I have planned\n2. Help me prioritize if there are many tasks\n3. Suggest which tasks to focus on first',
            },
          },
        ],
      }

    case 'overdue_tasks':
      return {
        description: 'Review overdue tasks and plan how to handle them',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'Please read my overdue tasks using the puratodo://tasks/overdue resource. Then:\n1. List all overdue tasks\n2. Help me understand why they might be overdue\n3. Suggest how to handle them (complete, reschedule, or delete)',
            },
          },
        ],
      }

    case 'weekly_review':
      return {
        description: 'Show me tasks for this week: today, upcoming, and overdue. Give me a summary.',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'Please give me a weekly review by:\n1. Reading my today\'s tasks (puratodo://tasks/today)\n2. Reading my overdue tasks (puratodo://tasks/overdue)\n3. Reading my starred tasks (puratodo://tasks/starred)\n\nThen provide a summary of my workload and any recommendations.',
            },
          },
        ],
      }

    case 'add_task': {
      const taskName = args?.task_name || '[task name]'
      const dueDate = args?.due_date

      let promptText = `Add a new task named "${taskName}"`
      if (dueDate) {
        promptText += ` due on ${dueDate}`
      }
      promptText += '. First, read my lists (puratodo://lists) to show me where I can add it, then ask which list to add it to before using the create_task tool.'

      return {
        description: 'Add a new task to a list',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: promptText,
            },
          },
        ],
      }
    }

    case 'search_and_complete': {
      const query = args?.query || '[search query]'

      return {
        description: 'Search for tasks by keyword and offer to complete them',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Search for tasks containing "${query}" using the search_tasks tool. Then show me the results and ask if I want to complete any of them.`,
            },
          },
        ],
      }
    }

    default:
      throw new Error(`Unknown prompt: ${name}`)
  }
}

/**
 * Get list of all available prompts
 */
export function listPrompts(): MCPPrompt[] {
  return prompts
}
