"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getOrCreateInboxListForUser } from "@/lib/inbox";

export type List = {
  id: string;
  user_id: string;
  group_id: string;
  name: string;
  icon: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export async function getLists(groupId?: string): Promise<List[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  let query = supabase
    .from("lists")
    .select("*")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true });

  if (groupId) {
    query = query.eq("group_id", groupId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching lists:", error);
    return [];
  }

  return data || [];
}

export async function getOrCreateInboxList(): Promise<List | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const inboxList = await getOrCreateInboxListForUser(supabase, user.id);
  if (!inboxList) {
    return null;
  }

  revalidatePath("/dashboard");
  return inboxList as List;
}

export async function createList(
  groupId: string,
  name: string,
  icon?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get max sort_order for this group
  const { data: existingLists } = await supabase
    .from("lists")
    .select("sort_order")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const maxOrder = existingLists?.[0]?.sort_order ?? -1;

  const { error } = await supabase.from("lists").insert({
    user_id: user.id,
    group_id: groupId,
    name,
    icon: icon || null,
    sort_order: maxOrder + 1,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateList(
  id: string,
  data: { name?: string; icon?: string }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error: updateError } = await supabase
    .from("lists")
    .update(data)
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteList(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("lists")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function reorderLists(
  groupId: string,
  orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Update sort_order for each list
  const updates = orderedIds.map((id, index) =>
    supabase
      .from("lists")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("group_id", groupId)
      .eq("user_id", user.id)
  );

  const results = await Promise.all(updates);
  const errors = results.filter((r) => r.error);

  if (errors.length > 0) {
    return { success: false, error: errors[0].error?.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function moveListToGroup(
  listId: string,
  targetGroupId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get max sort_order for target group
  const { data: existingLists } = await supabase
    .from("lists")
    .select("sort_order")
    .eq("group_id", targetGroupId)
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const maxOrder = existingLists?.[0]?.sort_order ?? -1;

  const { error } = await supabase
    .from("lists")
    .update({ group_id: targetGroupId, sort_order: maxOrder + 1 })
    .eq("id", listId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
