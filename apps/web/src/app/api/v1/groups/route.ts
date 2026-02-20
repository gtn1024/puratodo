import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api/auth";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  withCors,
  corsPreflightResponse,
} from "@/lib/api/response";

export type Group = {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return corsPreflightResponse();
}

// GET /api/v1/groups - Get all groups for authenticated user
export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request.headers.get("Authorization"));

  if (!auth) {
    return withCors(unauthorizedResponse());
  }

  try {
    const { data, error } = await auth.supabase
      .from("groups")
      .select("*")
      .eq("user_id", auth.id)
      .order("sort_order", { ascending: true });

    if (error) {
      return withCors(errorResponse(error.message, 500));
    }

    return withCors(successResponse<Group[]>(data || []));
  } catch (err) {
    console.error("Error fetching groups:", err);
    return withCors(errorResponse("Failed to fetch groups", 500));
  }
}

// POST /api/v1/groups - Create a new group
export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request.headers.get("Authorization"));

  if (!auth) {
    return withCors(unauthorizedResponse());
  }

  try {
    const body = await request.json();
    const { name, color } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return withCors(errorResponse("Name is required"));
    }

    // Get max sort_order
    const { data: existingGroups } = await auth.supabase
      .from("groups")
      .select("sort_order")
      .eq("user_id", auth.id)
      .order("sort_order", { ascending: false })
      .limit(1);

    const maxOrder = existingGroups?.[0]?.sort_order ?? -1;

    const { data, error } = await auth.supabase
      .from("groups")
      .insert({
        user_id: auth.id,
        name: name.trim(),
        color: color || null,
        sort_order: maxOrder + 1,
      })
      .select()
      .single();

    if (error) {
      return withCors(errorResponse(error.message, 500));
    }

    return withCors(successResponse<Group>(data, 201));
  } catch (err) {
    console.error("Error creating group:", err);
    return withCors(errorResponse("Failed to create group", 500));
  }
}
