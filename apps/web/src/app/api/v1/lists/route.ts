import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api/auth";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  withCors,
  corsPreflightResponse,
} from "@/lib/api/response";

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

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return corsPreflightResponse();
}

// GET /api/v1/lists - Get all lists, optionally filtered by group_id
export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request.headers.get("Authorization"));

  if (!auth) {
    return withCors(unauthorizedResponse());
  }

  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("group_id");

    let query = auth.supabase
      .from("lists")
      .select("*")
      .eq("user_id", auth.id)
      .order("sort_order", { ascending: true });

    if (groupId) {
      query = query.eq("group_id", groupId);
    }

    const { data, error } = await query;

    if (error) {
      return withCors(errorResponse(error.message, 500));
    }

    return withCors(successResponse<List[]>(data || []));
  } catch (err) {
    console.error("Error fetching lists:", err);
    return withCors(errorResponse("Failed to fetch lists", 500));
  }
}

// POST /api/v1/lists - Create a new list
export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request.headers.get("Authorization"));

  if (!auth) {
    return withCors(unauthorizedResponse());
  }

  try {
    const body = await request.json();
    const { group_id, name, icon } = body;

    if (!group_id || typeof group_id !== "string") {
      return withCors(errorResponse("group_id is required"));
    }

    if (!name || typeof name !== "string" || name.trim() === "") {
      return withCors(errorResponse("Name is required"));
    }

    // Verify the group exists and belongs to the user
    const { data: group, error: groupError } = await auth.supabase
      .from("groups")
      .select("id")
      .eq("id", group_id)
      .eq("user_id", auth.id)
      .single();

    if (groupError || !group) {
      return withCors(errorResponse("Group not found or does not belong to you", 404));
    }

    // Get max sort_order for this group
    const { data: existingLists } = await auth.supabase
      .from("lists")
      .select("sort_order")
      .eq("group_id", group_id)
      .eq("user_id", auth.id)
      .order("sort_order", { ascending: false })
      .limit(1);

    const maxOrder = existingLists?.[0]?.sort_order ?? -1;

    const { data, error } = await auth.supabase
      .from("lists")
      .insert({
        user_id: auth.id,
        group_id,
        name: name.trim(),
        icon: icon || null,
        sort_order: maxOrder + 1,
      })
      .select()
      .single();

    if (error) {
      return withCors(errorResponse(error.message, 500));
    }

    return withCors(successResponse<List>(data, 201));
  } catch (err) {
    console.error("Error creating list:", err);
    return withCors(errorResponse("Failed to create list", 500));
  }
}
