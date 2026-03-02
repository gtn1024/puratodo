import type { MCPTool, ToolExecutionResult } from './types'
import { createServiceClient } from '@/lib/auth-middleware'

/**
 * Available MCP Tools
 *
 * These tools allow MCP clients to perform mutations on tasks,
 * such as creating, updating, deleting, and completing tasks.
 */
export const tools: MCPTool[] = [
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
