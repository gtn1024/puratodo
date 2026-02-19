import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api/auth";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  withCors,
  corsPreflightResponse,
} from "@/lib/api/response";
import { parseRecurrenceFields } from "@/lib/recurrence";

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
  recurrence_frequency: string | null;
  recurrence_interval: number | null;
  recurrence_weekdays: number[] | null;
  recurrence_end_date: string | null;
  recurrence_end_count: number | null;
  recurrence_rule: string | null;
  recurrence_timezone: string | null;
  recurrence_source_task_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  subtasks?: Task[];
};

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return corsPreflightResponse();
}

// GET /api/v1/tasks - Get tasks with optional filters
export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request.headers.get("Authorization"));

  if (!auth) {
    return withCors(unauthorizedResponse());
  }

  try {
    const { searchParams } = new URL(request.url);
    const listId = searchParams.get("list_id");
    const completed = searchParams.get("completed");
    const starred = searchParams.get("starred");
    const parentId = searchParams.get("parent_id");

    let query = auth.supabase
      .from("tasks")
      .select("*")
      .eq("user_id", auth.id)
      .order("sort_order", { ascending: true });

    if (listId) {
      query = query.eq("list_id", listId);
    }

    if (completed !== null) {
      query = query.eq("completed", completed === "true");
    }

    if (starred !== null) {
      query = query.eq("starred", starred === "true");
    }

    if (parentId !== null) {
      if (parentId === "null" || parentId === "") {
        query = query.is("parent_id", null);
      } else {
        query = query.eq("parent_id", parentId);
      }
    }

    const { data, error } = await query;

    if (error) {
      return withCors(errorResponse(error.message, 500));
    }

    return withCors(successResponse<Task[]>(data || []));
  } catch (err) {
    console.error("Error fetching tasks:", err);
    return withCors(errorResponse("Failed to fetch tasks", 500));
  }
}

// POST /api/v1/tasks - Create a new task
export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request.headers.get("Authorization"));

  if (!auth) {
    return withCors(unauthorizedResponse());
  }

  try {
    const body = await request.json();
    const {
      list_id,
      parent_id,
      name,
      completed,
      starred,
      due_date,
      plan_date,
      comment,
      duration_minutes,
    } = body;

    const recurrenceResult = parseRecurrenceFields(body as Record<string, unknown>);
    if (recurrenceResult.error) {
      return withCors(errorResponse(recurrenceResult.error));
    }

    if (!list_id || typeof list_id !== "string") {
      return withCors(errorResponse("list_id is required"));
    }

    if (!name || typeof name !== "string" || name.trim() === "") {
      return withCors(errorResponse("Name is required"));
    }

    // Verify the list exists and belongs to the user
    const { data: list, error: listError } = await auth.supabase
      .from("lists")
      .select("id")
      .eq("id", list_id)
      .eq("user_id", auth.id)
      .single();

    if (listError || !list) {
      return withCors(errorResponse("List not found or does not belong to you", 404));
    }

    // If parent_id is specified, verify it exists and belongs to the user
    if (parent_id) {
      const { data: parentTask, error: parentError } = await auth.supabase
        .from("tasks")
        .select("id, list_id")
        .eq("id", parent_id)
        .eq("user_id", auth.id)
        .single();

      if (parentError || !parentTask) {
        return withCors(errorResponse("Parent task not found", 404));
      }

      // Parent task must be in the same list
      if (parentTask.list_id !== list_id) {
        return withCors(errorResponse("Parent task must be in the same list"));
      }
    }

    // Get max sort_order for this list (and parent if specified)
    let sortQuery = auth.supabase
      .from("tasks")
      .select("sort_order")
      .eq("list_id", list_id)
      .eq("user_id", auth.id);

    if (parent_id) {
      sortQuery = sortQuery.eq("parent_id", parent_id);
    } else {
      sortQuery = sortQuery.is("parent_id", null);
    }

    const { data: existingTasks } = await sortQuery
      .order("sort_order", { ascending: false })
      .limit(1);

    const maxOrder = existingTasks?.[0]?.sort_order ?? -1;

    const { data, error } = await auth.supabase
      .from("tasks")
      .insert({
        user_id: auth.id,
        list_id,
        parent_id: parent_id || null,
        name: name.trim(),
        completed: completed ?? false,
        starred: starred ?? false,
        due_date: due_date || null,
        plan_date: plan_date || null,
        comment: comment || null,
        duration_minutes: duration_minutes || null,
        ...recurrenceResult.data,
        sort_order: maxOrder + 1,
      })
      .select()
      .single();

    if (error) {
      return withCors(errorResponse(error.message, 500));
    }

    return withCors(successResponse<Task>(data, 201));
  } catch (err) {
    console.error("Error creating task:", err);
    return withCors(errorResponse("Failed to create task", 500));
  }
}
