import { GroupAdapter } from "@puratodo/api-types";
import * as groupActions from "./groupActions";

/**
 * SupabaseGroupAdapter - Implements GroupAdapter interface using Supabase Server Actions
 * This adapter is used by the web app to interact with group data
 *
 * Note: This is a plain object with methods that call server actions.
 * Each method delegates to a server action that can be called from client components.
 */
export const SupabaseGroupAdapter: GroupAdapter = {
  createGroup: groupActions.createGroup,
  getGroup: groupActions.getGroup,
  updateGroup: groupActions.updateGroup,
  deleteGroup: groupActions.deleteGroup,
  getAllGroups: groupActions.getAllGroups,
  reorderGroups: groupActions.reorderGroups,
};
