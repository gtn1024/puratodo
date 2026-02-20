import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api/auth";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  withCors,
  corsPreflightResponse,
} from "@/lib/api/response";
import { parseRecurrenceFields } from "@/lib/recurrence";
import {
  isValidRecurrenceUpdateScope,
  updateTaskWithRecurrenceHandling,
} from "@/lib/recurrence-runtime";
import { Task } from "../route";

// Helper to recursively fetch subtasks
async function getSubtasksRecursively(
  supabase: ReturnType<typeof getAuthenticatedUser> extends Promise<infer T> ? T extends { supabase: infer S } ? S : never : never,
  userId: string,
  parentId: string
): Promise<Task[]> {
  const { data: subtasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("parent_id", parentId)
    .order("sort_order", { ascending: true });

  if (error || !subtasks) {
    return [];
  }

  const tasksWithSubtasks = await Promise.all(
    subtasks.map(async (task) => {
      const nestedSubtasks = await getSubtasksRecursively(supabase, userId, task.id);
      return { ...task, subtasks: nestedSubtasks };
    })
  );

  return tasksWithSubtasks as Task[];
}

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return corsPreflightResponse();
}

// GET /api/v1/tasks/[id] - Get a single task by ID with subtasks
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthenticatedUser(request.headers.get("Authorization"));

  if (!auth) {
    return withCors(unauthorizedResponse());
  }

  const { id } = await params;

  try {
    const { data, error } = await auth.supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.id)
      .single();

    if (error || !data) {
      return withCors(notFoundResponse("Task not found"));
    }

    // Fetch subtasks recursively
    const subtasks = await getSubtasksRecursively(auth.supabase, auth.id, id);

    return withCors(successResponse<Task>({ ...data, subtasks }));
  } catch (err) {
    console.error("Error fetching task:", err);
    return withCors(errorResponse("Failed to fetch task", 500));
  }
}

// PATCH /api/v1/tasks/[id] - Update a task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthenticatedUser(request.headers.get("Authorization"));

  if (!auth) {
    return withCors(unauthorizedResponse());
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const {
      name,
      completed,
      starred,
      due_date,
      plan_date,
      comment,
      duration_minutes,
      remind_at,
      list_id,
    } = body;

    const recurrenceScopeRaw = body.recurrence_update_scope;
    if (
      recurrenceScopeRaw !== undefined &&
      !isValidRecurrenceUpdateScope(recurrenceScopeRaw)
    ) {
      return withCors(
        errorResponse("recurrence_update_scope must be one of: single, future")
      );
    }

    // Build update data - only include fields that are provided
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        return withCors(errorResponse("Name must be a non-empty string"));
      }
      updateData.name = name.trim();
    }
    if (completed !== undefined) {
      updateData.completed = Boolean(completed);
    }
    if (starred !== undefined) {
      updateData.starred = Boolean(starred);
    }
    if (due_date !== undefined) {
      updateData.due_date = due_date || null;
    }
    if (plan_date !== undefined) {
      updateData.plan_date = plan_date || null;
    }
    if (comment !== undefined) {
      updateData.comment = comment || null;
    }
    if (duration_minutes !== undefined) {
      updateData.duration_minutes = duration_minutes ? Number(duration_minutes) : null;
    }
    if (remind_at !== undefined) {
      updateData.remind_at = remind_at || null;
    }
    if (list_id !== undefined) {
      updateData.list_id = list_id;
    }

    const recurrenceResult = parseRecurrenceFields(
      body as Record<string, unknown>,
      { partial: true }
    );
    if (recurrenceResult.error) {
      return withCors(errorResponse(recurrenceResult.error));
    }
    Object.assign(updateData, recurrenceResult.data);

    if (Object.keys(updateData).length === 0) {
      return withCors(errorResponse("At least one field must be provided"));
    }

    const result = await updateTaskWithRecurrenceHandling({
      supabase: auth.supabase,
      userId: auth.id,
      taskId: id,
      patch: {
        ...updateData,
        recurrence_update_scope: recurrenceScopeRaw,
      },
    });

    if (result.status === 404) {
      return withCors(notFoundResponse(result.error || "Task not found"));
    }

    if (result.error || !result.task) {
      return withCors(errorResponse(result.error || "Failed to update task", 500));
    }

    return withCors(successResponse<Task>(result.task));
  } catch (err) {
    console.error("Error updating task:", err);
    return withCors(errorResponse("Failed to update task", 500));
  }
}

// DELETE /api/v1/tasks/[id] - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthenticatedUser(request.headers.get("Authorization"));

  if (!auth) {
    return withCors(unauthorizedResponse());
  }

  const { id } = await params;

  try {
    // First check if the task exists and belongs to the user
    const { data: existingTask, error: fetchError } = await auth.supabase
      .from("tasks")
      .select("id")
      .eq("id", id)
      .eq("user_id", auth.id)
      .single();

    if (fetchError || !existingTask) {
      return withCors(notFoundResponse("Task not found"));
    }

    // Delete the task (subtasks will be cascade deleted by database)
    const { error } = await auth.supabase
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.id);

    if (error) {
      return withCors(errorResponse(error.message, 500));
    }

    return withCors(successResponse({ id }));
  } catch (err) {
    console.error("Error deleting task:", err);
    return withCors(errorResponse("Failed to delete task", 500));
  }
}
