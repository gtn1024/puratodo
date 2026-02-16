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
import { Group } from "../route";

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return corsPreflightResponse();
}

// GET /api/v1/groups/[id] - Get a single group by ID
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
      .from("groups")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.id)
      .single();

    if (error || !data) {
      return withCors(notFoundResponse("Group not found"));
    }

    return withCors(successResponse<Group>(data));
  } catch (err) {
    console.error("Error fetching group:", err);
    return withCors(errorResponse("Failed to fetch group", 500));
  }
}

// PATCH /api/v1/groups/[id] - Update a group
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
    const { name, color } = body;

    // At least one field must be provided
    if (name === undefined && color === undefined) {
      return withCors(errorResponse("At least one field (name or color) must be provided"));
    }

    const updateData: { name?: string; color?: string | null } = {};
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        return withCors(errorResponse("Name must be a non-empty string"));
      }
      updateData.name = name.trim();
    }
    if (color !== undefined) {
      updateData.color = color || null;
    }

    // First check if the group exists and belongs to the user
    const { data: existingGroup, error: fetchError } = await auth.supabase
      .from("groups")
      .select("id")
      .eq("id", id)
      .eq("user_id", auth.id)
      .single();

    if (fetchError || !existingGroup) {
      return withCors(notFoundResponse("Group not found"));
    }

    const { data, error } = await auth.supabase
      .from("groups")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", auth.id)
      .select()
      .single();

    if (error) {
      return withCors(errorResponse(error.message, 500));
    }

    return withCors(successResponse<Group>(data));
  } catch (err) {
    console.error("Error updating group:", err);
    return withCors(errorResponse("Failed to update group", 500));
  }
}

// DELETE /api/v1/groups/[id] - Delete a group
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
    // First check if the group exists and belongs to the user
    const { data: existingGroup, error: fetchError } = await auth.supabase
      .from("groups")
      .select("id")
      .eq("id", id)
      .eq("user_id", auth.id)
      .single();

    if (fetchError || !existingGroup) {
      return withCors(notFoundResponse("Group not found"));
    }

    const { error } = await auth.supabase
      .from("groups")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.id);

    if (error) {
      return withCors(errorResponse(error.message, 500));
    }

    return withCors(successResponse({ id }));
  } catch (err) {
    console.error("Error deleting group:", err);
    return withCors(errorResponse("Failed to delete group", 500));
  }
}
