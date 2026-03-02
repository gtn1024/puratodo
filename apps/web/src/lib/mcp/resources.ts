import type { MCPResource } from './types'
import { getLocalDateString } from '@puratodo/shared'
import { createServiceClient } from '@/lib/auth-middleware'

/**
 * Available MCP Resources
 *
 * These resources provide read-only access to user data through
 * standardized URIs that MCP clients can discover and read.
 */
export const resources: MCPResource[] = [
  {
    uri: 'puratodo://groups',
    name: 'Groups',
    description: 'All task groups (categories) for the authenticated user',
    mimeType: 'application/json',
  },
  {
    uri: 'puratodo://lists',
    name: 'Lists',
    description: 'All task lists for the authenticated user',
    mimeType: 'application/json',
  },
  {
    uri: 'puratodo://tasks/today',
    name: 'Today\'s Tasks',
    description: 'Tasks planned for today (plan_date = today)',
    mimeType: 'application/json',
  },
  {
    uri: 'puratodo://tasks/overdue',
    name: 'Overdue Tasks',
    description: 'Incomplete tasks with due_date before today',
    mimeType: 'application/json',
  },
  {
    uri: 'puratodo://tasks/starred',
    name: 'Starred Tasks',
    description: 'All starred tasks for the authenticated user',
    mimeType: 'application/json',
  },
  {
    uri: 'puratodo://tasks/inbox',
    name: 'Inbox Tasks',
    description: 'All tasks in the inbox (unsorted tasks)',
    mimeType: 'application/json',
  },
]

/**
 * Read a resource by URI
 *
 * @param uri - The resource URI (e.g., puratodo://groups)
 * @param userId - The authenticated user's ID
 * @returns JSON data for the resource
 */
export async function readResource(
  uri: string,
  userId: string,
): Promise<unknown> {
  const supabase = createServiceClient()

  // Parse the URI
  if (!uri.startsWith('puratodo://')) {
    throw new Error(`Invalid URI scheme: ${uri}`)
  }

  const path = uri.slice('puratodo://'.length)

  switch (path) {
    case 'groups': {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch groups: ${error.message}`)
      }

      return data
    }

    case 'lists': {
      const { data, error } = await supabase
        .from('lists')
        .select(`
          *,
          groups (
            id,
            name,
            color
          )
        `)
        .eq('user_id', userId)
        .order('sort_order', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch lists: ${error.message}`)
      }

      return data
    }

    case 'tasks/today': {
      const today = getLocalDateString(new Date())

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
        .eq('plan_date', today)
        .is('parent_id', null)
        .order('sort_order', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch today's tasks: ${error.message}`)
      }

      return data
    }

    case 'tasks/overdue': {
      const today = getLocalDateString(new Date())

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
        .eq('completed', false)
        .lt('due_date', today)
        .is('parent_id', null)
        .order('due_date', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch overdue tasks: ${error.message}`)
      }

      return data
    }

    case 'tasks/starred': {
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
        .eq('starred', true)
        .is('parent_id', null)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch starred tasks: ${error.message}`)
      }

      return data
    }

    case 'tasks/inbox': {
      // Get the user's inbox list
      const { data: inboxList, error: inboxError } = await supabase
        .from('lists')
        .select('id')
        .eq('user_id', userId)
        .eq('name', 'Inbox')
        .single()

      if (inboxError || !inboxList) {
        // No inbox list means no inbox tasks
        return []
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('list_id', inboxList.id)
        .is('parent_id', null)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch inbox tasks: ${error.message}`)
      }

      return data
    }

    default:
      throw new Error(`Unknown resource: ${path}`)
  }
}

/**
 * Get list of all available resources
 */
export function listResources(): MCPResource[] {
  return resources
}
