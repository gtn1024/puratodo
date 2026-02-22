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

// GET /api/v1/tasks/date-range - Get tasks with plan_date or due_date in a date range
export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request.headers.get("Authorization"));

  if (!auth) {
    return withCors(unauthorizedResponse());
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const listId = searchParams.get("listId");

    // Validate required parameters
    if (!startDate || !endDate) {
      return withCors(errorResponse("startDate and endDate are required"));
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return withCors(errorResponse("Invalid date format. Use YYYY-MM-DD"));
    }

    // Get tasks with plan_date or due_date in the range
    let query = auth.supabase
      .from("tasks")
      .select("*")
      .eq("user_id", auth.id)
      .or(`plan_date.gte.${startDate},due_date.gte.${startDate}`)
      .or(`plan_date.lte.${endDate},due_date.lte.${endDate}`)
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
    console.error("Error fetching tasks by date range:", err);
    return withCors(errorResponse("Failed to fetch tasks by date range", 500));
  }
}
