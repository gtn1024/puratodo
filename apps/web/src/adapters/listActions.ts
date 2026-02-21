"use server";

import { List, ListInsert, ListUpdate } from "@puratodo/api-types";
import {
  createList as dbCreateList,
  getLists,
  updateList as dbUpdateList,
  deleteList as dbDeleteList,
  reorderLists as dbReorderLists,
  moveListToGroup,
} from "@/actions/lists";
import { createClient } from "@/lib/supabase/server";

export async function createList(list: ListInsert): Promise<List> {
  const result = await dbCreateList(list.group_id, list.name, list.icon || undefined);

  if (!result.success) {
    throw new Error(result.error || "Failed to create list");
  }

  const lists = await getLists(list.group_id);
  const createdList = lists.find(l =>
    l.name === list.name &&
    l.group_id === list.group_id
  );

  if (!createdList) {
    throw new Error("Failed to fetch created list");
  }

  return createdList;
}

export async function getList(id: string): Promise<List | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("lists")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("Error fetching list:", error);
    return null;
  }

  return data;
}

export async function updateList(id: string, updates: ListUpdate): Promise<List> {
  const updateData: { name?: string; icon?: string } = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.icon !== undefined) updateData.icon = updates.icon || undefined;

  const result = await dbUpdateList(id, updateData);

  if (!result.success) {
    throw new Error(result.error || "Failed to update list");
  }

  const updatedList = await getList(id);
  if (!updatedList) {
    throw new Error("Failed to fetch updated list");
  }

  return updatedList;
}

export async function deleteList(id: string): Promise<void> {
  const result = await dbDeleteList(id);

  if (!result.success) {
    throw new Error(result.error || "Failed to delete list");
  }
}

export async function getListsByGroup(groupId: string): Promise<List[]> {
  return await getLists(groupId);
}

export async function getAllLists(): Promise<List[]> {
  return await getLists();
}

export async function moveList(listId: string, targetGroupId: string): Promise<List> {
  const result = await moveListToGroup(listId, targetGroupId);

  if (!result.success) {
    throw new Error(result.error || "Failed to move list");
  }

  const movedList = await getList(listId);
  if (!movedList) {
    throw new Error("Failed to fetch moved list");
  }

  return movedList;
}

export async function reorderLists(listIds: string[]): Promise<void> {
  if (listIds.length === 0) return;

  const firstList = await getList(listIds[0]);
  if (!firstList) {
    throw new Error("List not found");
  }

  const result = await dbReorderLists(firstList.group_id, listIds);

  if (!result.success) {
    throw new Error(result.error || "Failed to reorder lists");
  }
}
