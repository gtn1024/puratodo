import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api/auth";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  withCors,
  corsPreflightResponse,
} from "@/lib/api/response";
import { Task } from "../route";

export type TaskWithListInfo = Task & {
  list_name: string;
  list_icon: string;
  group_name: string;
  group_color: string;
};

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return corsPreflightResponse();
}

// GET /api/v1/tasks/unscheduled - Get incomplete tasks with no plan_date
export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request.headers.get("Authorization"));

  if (!auth) {
    return withCors(unauthorizedResponse());
  }

  try {
    const { searchParams } = new URL(request.url);
    const listId = searchParams.get("listId");

    // Get incomplete tasks with no plan_date (root tasks only, not subtasks)
    let query = auth.supabase
      .from("tasks")
      .select("*")
      .eq("user_id", auth.id)
      .eq("completed", false)
      .is("plan_date", null)
      .is("parent_id", null)
      .order("sort_order", { ascending: true });

    // Filter by list if provided
    if (listId) {
      query = query.eq("list_id", listId);
    }

    const { data: tasks, error } = await query;

    if (error) {
      return withCors(errorResponse(error.message, 500));
    }

    if (!tasks || tasks.length === 0) {
      return withCors(successResponse<TaskWithListInfo[]>([]));
    }

    // Get all list and group info for the results
    const listIds = [...new Set(tasks.map((t) => t.list_id))];
    const { data: lists } = await auth.supabase
      .from("lists")
      .select("id, name, icon, group_id")
      .in("id", listIds);

    const groupIds = [...new Set(lists?.map((l) => l.group_id) || [])];
    const { data: groups } = await auth.supabase
      .from("groups")
      .select("id, name, color")
      .in("id", groupIds);

    // Combine data
    const results: TaskWithListInfo[] = tasks.map((task) => {
      const list = lists?.find((l) => l.id === task.list_id);
      const group = groups?.find((g) => g.id === list?.group_id);
      return {
        ...task,
        list_name: list?.name || "Unknown List",
        list_icon: list?.icon || "📋",
        group_name: group?.name || "Unknown Group",
        group_color: group?.color || "#6b7280",
      };
    });

    return withCors(successResponse<TaskWithListInfo[]>(results));
  } catch (err) {
    console.error("Error fetching unscheduled tasks:", err);
    return withCors(errorResponse("Failed to fetch unscheduled tasks", 500));
  }
}
