import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api/auth";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  withCors,
  corsPreflightResponse,
} from "@/lib/api/response";

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return corsPreflightResponse();
}

// PATCH /api/v1/lists/reorder - Reorder lists within a group
export async function PATCH(request: NextRequest) {
  const auth = await getAuthenticatedUser(request.headers.get("Authorization"));

  if (!auth) {
    return withCors(unauthorizedResponse());
  }

  try {
    const body = await request.json();
    const { listIds, group_id } = body;

    if (!Array.isArray(listIds) || listIds.length === 0) {
      return withCors(errorResponse("listIds must be a non-empty array"));
    }

    if (!group_id || typeof group_id !== "string") {
      return withCors(errorResponse("group_id is required"));
    }

    // Validate all IDs are strings
    if (!listIds.every((id) => typeof id === "string")) {
      return withCors(errorResponse("All list IDs must be strings"));
    }

    // Verify the group belongs to the user
    const { data: group, error: groupError } = await auth.supabase
      .from("groups")
      .select("id")
      .eq("id", group_id)
      .eq("user_id", auth.id)
      .single();

    if (groupError || !group) {
      return withCors(errorResponse("Group not found or does not belong to you", 404));
    }

    // Verify all lists belong to the user and the specified group
    const { data: userLists, error: fetchError } = await auth.supabase
      .from("lists")
      .select("id")
      .eq("group_id", group_id)
      .eq("user_id", auth.id);

    if (fetchError) {
      return withCors(errorResponse(fetchError.message, 500));
    }

    const userListIds = new Set(userLists?.map((l) => l.id) || []);
    const invalidIds = listIds.filter((id) => !userListIds.has(id));

    if (invalidIds.length > 0) {
      return withCors(errorResponse("Some list IDs do not exist or do not belong to you in this group"));
    }

    // Update sort_order for each list
    const updates = listIds.map((id, index) =>
      auth.supabase
        .from("lists")
        .update({ sort_order: index })
        .eq("id", id)
        .eq("group_id", group_id)
        .eq("user_id", auth.id)
    );

    const results = await Promise.all(updates);
    const errors = results.filter((r) => r.error);

    if (errors.length > 0) {
      return withCors(errorResponse(errors[0].error?.message || "Failed to reorder lists", 500));
    }

    return withCors(successResponse({ reordered: listIds.length }));
  } catch (err) {
    console.error("Error reordering lists:", err);
    return withCors(errorResponse("Failed to reorder lists", 500));
  }
}
