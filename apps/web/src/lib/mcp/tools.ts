import type { MCPTool, ToolExecutionResult } from './types'
import { getLocalDateString } from '@puratodo/shared'
import { createServiceClient } from '@/lib/auth-middleware'

// Type for task record from database
interface TaskRecord {
  id: string
  user_id: string
  list_id: string
  parent_id: string | null
  name: string
  completed: boolean
  starred: boolean
  due_date: string | null
  plan_date: string | null
  comment: string | null
  duration_minutes: number | null
  sort_order: number
  created_at: string
  updated_at: string
  lists?: {
    id: string
    name: string
    icon: string | null
  }
}

// Type for task with nested subtasks
interface TaskWithSubtasks extends TaskRecord {
  subtasks: TaskWithSubtasks[]
}

/**
 * Available MCP Tools
 *
 * These tools allow MCP clients to perform mutations on tasks,
 * such as creating, updating, deleting, and completing tasks.
 */
export const tools: MCPTool[] = [
  {
    name: 'list_tasks',
    description: 'List tasks with optional filters (today, overdue, starred, inbox, or all)',
    inputSchema: {
      type: 'object',
      properties: {
        view: {
          type: 'string',
          enum: ['today', 'overdue', 'starred', 'inbox', 'all'],
          description: 'Task view filter (default: all)',
        },
        completed: {
          type: 'boolean',
          description: 'Optional completion status filter (ignored for overdue view)',
        },
        list_id: {
          type: 'string',
          description: 'Optional list ID to filter tasks',
        },
        include_subtasks: {
          type: 'boolean',
          description: 'Include subtasks when true (default: false)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of tasks to return (default: 50, max: 200)',
        },
      },
    },
  },
  {
    name: 'create_task',
    description: 'Create a new task in a specified list',
    inputSchema: {
      type: 'object',
      properties: {
        list_id: {
          type: 'string',
          description: 'The ID of the list to create the task in',
        },
        name: {
          type: 'string',
          description: 'The name/title of the task',
        },
        parent_id: {
          type: 'string',
          description: 'Optional parent task ID for creating subtasks',
        },
        due_date: {
          type: 'string',
          description: 'Optional due date (YYYY-MM-DD format)',
        },
        plan_date: {
          type: 'string',
          description: 'Optional planned date (YYYY-MM-DD format)',
        },
        comment: {
          type: 'string',
          description: 'Optional comment/notes for the task',
        },
        duration_minutes: {
          type: 'number',
          description: 'Optional estimated duration in minutes',
        },
        starred: {
          type: 'boolean',
          description: 'Whether the task is starred',
        },
      },
      required: ['list_id', 'name'],
    },
  },
  {
    name: 'update_task',
    description: 'Update an existing task',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'The ID of the task to update',
        },
        name: {
          type: 'string',
          description: 'New name/title for the task',
        },
        completed: {
          type: 'boolean',
          description: 'Whether the task is completed',
        },
        starred: {
          type: 'boolean',
          description: 'Whether the task is starred',
        },
        due_date: {
          type: 'string',
          description: 'New due date (YYYY-MM-DD format, or null to remove)',
        },
        plan_date: {
          type: 'string',
          description: 'New planned date (YYYY-MM-DD format, or null to remove)',
        },
        comment: {
          type: 'string',
          description: 'New comment/notes for the task',
        },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'delete_task',
    description: 'Delete a task permanently',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'The ID of the task to delete',
        },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'complete_task',
    description: 'Mark a task as completed',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'The ID of the task to complete',
        },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'reorder_tasks',
    description: 'Reorder tasks within a list (and optionally within a parent task) by providing an ordered array of task IDs',
    inputSchema: {
      type: 'object',
      properties: {
        list_id: {
          type: 'string',
          description: 'The ID of the list the tasks belong to',
        },
        task_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Ordered array of task IDs (first = highest priority)',
        },
        parent_id: {
          type: 'string',
          description: 'Optional parent task ID when reordering subtasks',
        },
      },
      required: ['list_id', 'task_ids'],
    },
  },
  {
    name: 'current_time',
    description: 'Get the current date and time in a specified timezone',
    inputSchema: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description: 'IANA timezone identifier (default: Asia/Shanghai)',
        },
      },
    },
  },
  {
    name: 'search_tasks',
    description: 'Search for tasks by name',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query to match task names',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 20)',
        },
      },
      required: ['query'],
    },
  },
]

/**
 * Execute a tool by name
 *
 * @param name - The tool name
 * @param args - The tool arguments
 * @param userId - The authenticated user's ID
 * @returns Tool execution result
 */
export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  userId: string,
): Promise<ToolExecutionResult> {
  const supabase = createServiceClient()

  try {
    switch (name) {
      case 'list_tasks': {
        const { view = 'all', completed, list_id, include_subtasks = false, limit = 50 } = args
        const validViews = new Set(['today', 'overdue', 'starred', 'inbox', 'all'])

        if (typeof view !== 'string' || !validViews.has(view)) {
          return {
            content: [{
              type: 'text',
              text: 'Error: view must be one of today, overdue, starred, inbox, all',
            }],
            isError: true,
          }
        }

        if (list_id !== undefined && typeof list_id !== 'string') {
          return {
            content: [{ type: 'text', text: 'Error: list_id must be a string' }],
            isError: true,
          }
        }

        if (include_subtasks !== undefined && typeof include_subtasks !== 'boolean') {
          return {
            content: [{ type: 'text', text: 'Error: include_subtasks must be a boolean' }],
            isError: true,
          }
        }

        if (completed !== undefined && typeof completed !== 'boolean') {
          return {
            content: [{ type: 'text', text: 'Error: completed must be a boolean' }],
            isError: true,
          }
        }

        if (limit !== undefined && typeof limit !== 'number') {
          return {
            content: [{ type: 'text', text: 'Error: limit must be a number' }],
            isError: true,
          }
        }

        const requestedLimit = typeof limit === 'number' ? limit : 50
        if (!Number.isFinite(requestedLimit)) {
          return {
            content: [{ type: 'text', text: 'Error: limit must be a finite number' }],
            isError: true,
          }
        }

        const normalizedLimit = Math.max(1, Math.min(Math.floor(requestedLimit), 200))
        const today = getLocalDateString(new Date())

        // Helper function to build nested task tree
        function buildTaskTree(tasks: TaskRecord[]): TaskWithSubtasks[] {
          const taskMap = new Map<string, TaskWithSubtasks>()
          const rootTasks: TaskWithSubtasks[] = []

          // First pass: create map and add subtasks array
          for (const task of tasks) {
            taskMap.set(task.id, { ...task, subtasks: [] })
          }

          // Second pass: build tree structure
          for (const task of tasks) {
            const taskWithSubtasks = taskMap.get(task.id)!
            if (task.parent_id && taskMap.has(task.parent_id)) {
              taskMap.get(task.parent_id)!.subtasks.push(taskWithSubtasks)
            }
            else {
              rootTasks.push(taskWithSubtasks)
            }
          }

          return rootTasks
        }

        let query = supabase
          .from('tasks')
          .select(`
            *,
            lists (
              id,
              name,
              icon
            )
          `)
          .eq('user_id', userId)

        // When include_subtasks is false, only get root tasks
        // Exception: for "today" view, subtasks can be independently planned
        if (!include_subtasks && view !== 'today') {
          query = query.is('parent_id', null)
        }

        if (typeof list_id === 'string') {
          query = query.eq('list_id', list_id)
        }

        switch (view) {
          case 'today':
            query = query.eq('plan_date', today).order('sort_order', { ascending: true })
            break
          case 'overdue':
            query = query.eq('completed', false).lt('due_date', today).order('due_date', { ascending: true })
            break
          case 'starred':
            query = query.eq('starred', true).order('created_at', { ascending: false })
            break
          case 'inbox': {
            const { data: inboxList, error: inboxError } = await supabase
              .from('lists')
              .select('id')
              .eq('user_id', userId)
              .eq('name', 'Inbox')
              .single()

            if (inboxError || !inboxList) {
              return {
                content: [{ type: 'text', text: JSON.stringify([], null, 2) }],
              }
            }

            query = query.eq('list_id', inboxList.id).order('created_at', { ascending: false })
            break
          }
          case 'all':
            query = query.order('updated_at', { ascending: false })
            break
      case 'current_time': {
        const { timezone = 'Asia/Shanghai' } = args

        if (typeof timezone !== 'string') {
          return {
            content: [{ type: 'text', text: 'Error: timezone must be a string' }],
            isError: true,
          }
        }

        try {
          const now = new Date()
          const formatted = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            weekday: 'long',
          }).format(now)

          const dateStr = new Intl.DateTimeFormat('sv-SE', {
            timeZone: timezone,
          }).format(now)

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                timezone,
                date: dateStr,
                time: formatted,
                iso: now.toISOString(),
                unix: now.getTime(),
              }, null, 2),
            }],
          }
        }
        catch (e) {
          return {
            content: [{ type: 'text', text: `Error: Invalid timezone "${timezone}". Use IANA identifiers like Asia/Shanghai, America/New_York, etc.` }],
            isError: true,
          }
        }
      }

      default:
            break
        }

        if (view !== 'overdue' && typeof completed === 'boolean') {
          query = query.eq('completed', completed)
        }

        const { data, error } = await query.limit(normalizedLimit)

        if (error) {
          return {
            content: [{ type: 'text', text: `Error listing tasks: ${error.message}` }],
            isError: true,
          }
        }

        // Build nested structure if subtasks are included
        const result = include_subtasks ? buildTaskTree(data || []) : (data || [])

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        }
      }

      case 'create_task': {
        const { list_id, name: taskName, parent_id, due_date, plan_date, comment, duration_minutes, starred } = args

        if (!list_id || typeof list_id !== 'string') {
          return {
            content: [{ type: 'text', text: 'Error: list_id is required' }],
            isError: true,
          }
        }

        if (!taskName || typeof taskName !== 'string') {
          return {
            content: [{ type: 'text', text: 'Error: name is required' }],
            isError: true,
          }
        }

        // Verify the list belongs to the user
        const { data: list, error: listError } = await supabase
          .from('lists')
          .select('id')
          .eq('id', list_id)
          .eq('user_id', userId)
          .single()

        if (listError || !list) {
          return {
            content: [{ type: 'text', text: 'Error: List not found or access denied' }],
            isError: true,
          }
        }

        // Get max sort_order
        const { data: existingTasks } = await supabase
          .from('tasks')
          .select('sort_order')
          .eq('user_id', userId)
          .eq('list_id', list_id)
          .is('parent_id', parent_id || null)
          .order('sort_order', { ascending: false })
          .limit(1)

        const maxOrder = existingTasks?.[0]?.sort_order ?? -1

        const { data, error } = await supabase
          .from('tasks')
          .insert({
            user_id: userId,
            list_id,
            name: taskName,
            parent_id: parent_id || null,
            due_date: due_date || null,
            plan_date: plan_date || null,
            comment: comment || null,
            duration_minutes: duration_minutes || null,
            starred: starred || false,
            sort_order: maxOrder + 1,
          })
          .select()
          .single()

        if (error) {
          return {
            content: [{ type: 'text', text: `Error creating task: ${error.message}` }],
            isError: true,
          }
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        }
      }

      case 'update_task': {
        const { task_id, name: taskName, completed, starred, due_date, plan_date, comment } = args

        if (!task_id || typeof task_id !== 'string') {
          return {
            content: [{ type: 'text', text: 'Error: task_id is required' }],
            isError: true,
          }
        }

        const updateData: Record<string, unknown> = {}
        if (taskName !== undefined)
          updateData.name = taskName
        if (completed !== undefined)
          updateData.completed = completed
        if (starred !== undefined)
          updateData.starred = starred
        if (due_date !== undefined)
          updateData.due_date = due_date
        if (plan_date !== undefined)
          updateData.plan_date = plan_date
        if (comment !== undefined)
          updateData.comment = comment

        const { data, error } = await supabase
          .from('tasks')
          .update(updateData)
          .eq('id', task_id)
          .eq('user_id', userId)
          .select()
          .single()

        if (error) {
          return {
            content: [{ type: 'text', text: `Error updating task: ${error.message}` }],
            isError: true,
          }
        }

        if (!data) {
          return {
            content: [{ type: 'text', text: 'Error: Task not found or access denied' }],
            isError: true,
          }
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        }
      }

      case 'delete_task': {
        const { task_id } = args

        if (!task_id || typeof task_id !== 'string') {
          return {
            content: [{ type: 'text', text: 'Error: task_id is required' }],
            isError: true,
          }
        }

        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', task_id)
          .eq('user_id', userId)

        if (error) {
          return {
            content: [{ type: 'text', text: `Error deleting task: ${error.message}` }],
            isError: true,
          }
        }

        return {
          content: [{ type: 'text', text: 'Task deleted successfully' }],
        }
      }

      case 'complete_task': {
        const { task_id } = args

        if (!task_id || typeof task_id !== 'string') {
          return {
            content: [{ type: 'text', text: 'Error: task_id is required' }],
            isError: true,
          }
        }

        const { data, error } = await supabase
          .from('tasks')
          .update({ completed: true })
          .eq('id', task_id)
          .eq('user_id', userId)
          .select()
          .single()

        if (error) {
          return {
            content: [{ type: 'text', text: `Error completing task: ${error.message}` }],
            isError: true,
          }
        }

        if (!data) {
          return {
            content: [{ type: 'text', text: 'Error: Task not found or access denied' }],
            isError: true,
          }
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        }
      }

      case 'reorder_tasks': {
        const { list_id, task_ids, parent_id } = args

        if (!list_id || typeof list_id !== 'string') {
          return {
            content: [{ type: 'text', text: 'Error: list_id is required' }],
            isError: true,
          }
        }

        if (!Array.isArray(task_ids) || task_ids.length === 0) {
          return {
            content: [{ type: 'text', text: 'Error: task_ids must be a non-empty array' }],
            isError: true,
          }
        }

        for (const id of task_ids) {
          if (typeof id !== 'string') {
            return {
              content: [{ type: 'text', text: 'Error: each task_id must be a string' }],
              isError: true,
            }
          }
        }

        const listCheck = await supabase
          .from('lists')
          .select('id')
          .eq('id', list_id)
          .eq('user_id', userId)
          .single()

        if (listCheck.error || !listCheck.data) {
          return {
            content: [{ type: 'text', text: 'Error: List not found or access denied' }],
            isError: true,
          }
        }

        const updates = task_ids.map((id: string, index: number) => {
          let q = supabase
            .from('tasks')
            .update({ sort_order: index })
            .eq('id', id)
            .eq('list_id', list_id)
            .eq('user_id', userId)

          if (parent_id && typeof parent_id === 'string') {
            q = q.eq('parent_id', parent_id)
          }
          else {
            q = q.is('parent_id', null)
          }

          return q
        })

        const results = await Promise.all(updates.map(q => q))
        const errors = results.filter(r => r.error)

        if (errors.length > 0) {
          return {
            content: [{ type: 'text', text: `Error reordering tasks: ${errors.map(e => e.error!.message).join(', ')}` }],
            isError: true,
          }
        }

        return {
          content: [{ type: 'text', text: `Successfully reordered ${task_ids.length} tasks` }],
        }
      }

      case 'search_tasks': {
        const { query, limit = 20 } = args

        if (!query || typeof query !== 'string') {
          return {
            content: [{ type: 'text', text: 'Error: query is required' }],
            isError: true,
          }
        }

        const { data, error } = await supabase
          .from('tasks')
          .select(`
            *,
            lists (
              id,
              name,
              icon
            )
          `)
          .eq('user_id', userId)
          .ilike('name', `%${query}%`)
          .limit(typeof limit === 'number' ? limit : 20)

        if (error) {
          return {
            content: [{ type: 'text', text: `Error searching tasks: ${error.message}` }],
            isError: true,
          }
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        }
      }

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        }
    }
  }
  catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
      isError: true,
    }
  }
}

/**
 * Get list of all available tools
 */
export function listTools(): MCPTool[] {
  return tools
}
