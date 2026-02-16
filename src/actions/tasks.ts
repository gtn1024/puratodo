"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type Task = {
  id: string;
  user_id: string;
  list_id: string;
  parent_id: string | null;
  name: string;
  completed: boolean;
  starred: boolean;
  due_date: string | null;
  plan_date: string | null;
  comment: string | null;
  duration_minutes: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  subtasks?: Task[];
};

export async function getTasks(listId?: string): Promise<Task[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  let query = supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .is("parent_id", null) // Only get top-level tasks
    .order("sort_order", { ascending: true });

  if (listId) {
    query = query.eq("list_id", listId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }

  return data || [];
}

export async function createTask(
  listId: string,
  name: string,
  parentId?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get max sort_order for this list (and parent if specified)
  const query = supabase
    .from("tasks")
    .select("sort_order")
    .eq("list_id", listId)
    .eq("user_id", user.id);

  const filteredQuery = parentId
    ? query.eq("parent_id", parentId)
    : query.is("parent_id", null);

  const { data: existingTasks } = await filteredQuery
    .order("sort_order", { ascending: false })
    .limit(1);

  const maxOrder = existingTasks?.[0]?.sort_order ?? -1;

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    list_id: listId,
    parent_id: parentId || null,
    name,
    completed: false,
    starred: false,
    sort_order: maxOrder + 1,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateTask(
  id: string,
  data: Partial<{
    name: string;
    completed: boolean;
    starred: boolean;
    due_date: string | null;
    plan_date: string | null;
    comment: string | null;
    duration_minutes: number | null;
  }>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error: updateError } = await supabase
    .from("tasks")
    .update(data)
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteTask(
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
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function reorderTasks(
  listId: string,
  orderedIds: string[],
  parentId?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Update sort_order for each task
  const updates = orderedIds.map((id, index) => {
    let query = supabase
      .from("tasks")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("list_id", listId)
      .eq("user_id", user.id);

    if (parentId) {
      query = query.eq("parent_id", parentId);
    } else {
      query = query.is("parent_id", null);
    }

    return query;
  });

  const results = await Promise.all(updates.map((q) => q));
  const errors = results.filter((r) => r.error);

  if (errors.length > 0) {
    return { success: false, error: errors[0].error?.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getSubtasks(parentId: string): Promise<Task[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("parent_id", parentId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching subtasks:", error);
    return [];
  }

  return data || [];
}

export async function getTasksWithSubtasks(listId?: string): Promise<Task[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  let query = supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .is("parent_id", null)
    .order("sort_order", { ascending: true });

  if (listId) {
    query = query.eq("list_id", listId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }

  // Recursively fetch subtasks for each task
  const fetchSubtasksRecursively = async (tasks: Task[]): Promise<Task[]> => {
    const tasksWithSubtasks = await Promise.all(
      tasks.map(async (task) => {
        const { data: subtasks } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", user.id)
          .eq("parent_id", task.id)
          .order("sort_order", { ascending: true });

        if (subtasks && subtasks.length > 0) {
          const nestedSubtasks = await fetchSubtasksRecursively(subtasks);
          return { ...task, subtasks: nestedSubtasks };
        }
        return { ...task, subtasks: [] };
      })
    );
    return tasksWithSubtasks as Task[];
  };

  return fetchSubtasksRecursively(data || []);
}
