'use server'

import type { Group, GroupInsert, GroupUpdate } from '@puratodo/api-types'
import {
  createGroup as dbCreateGroup,
  deleteGroup as dbDeleteGroup,
  reorderGroups as dbReorderGroups,
  updateGroup as dbUpdateGroup,
  getGroups,
} from '@/actions/groups'
import { createClient } from '@/lib/supabase/server'

export async function createGroup(group: GroupInsert): Promise<Group> {
  const result = await dbCreateGroup(group.name, group.color || undefined)

  if (!result.success) {
    throw new Error(result.error || 'Failed to create group')
  }

  const groups = await getGroups()
  const createdGroup = groups.find(g =>
    g.name === group.name
    && g.color === group.color,
  )

  if (!createdGroup) {
    throw new Error('Failed to fetch created group')
  }

  return createdGroup
}

export async function getGroup(id: string): Promise<Group | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('Error fetching group:', error)
    return null
  }

  return data
}

export async function updateGroup(id: string, updates: GroupUpdate): Promise<Group> {
  const updateData: { name?: string, color?: string } = {}
  if (updates.name !== undefined)
    updateData.name = updates.name
  if (updates.color !== undefined)
    updateData.color = updates.color || undefined

  const result = await dbUpdateGroup(id, updateData)

  if (!result.success) {
    throw new Error(result.error || 'Failed to update group')
  }

  const updatedGroup = await getGroup(id)
  if (!updatedGroup) {
    throw new Error('Failed to fetch updated group')
  }

  return updatedGroup
}

export async function deleteGroup(id: string): Promise<void> {
  const result = await dbDeleteGroup(id)

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete group')
  }
}

export async function getAllGroups(): Promise<Group[]> {
  return await getGroups()
}

export async function reorderGroups(groupIds: string[]): Promise<void> {
  const result = await dbReorderGroups(groupIds)

  if (!result.success) {
    throw new Error(result.error || 'Failed to reorder groups')
  }
}
