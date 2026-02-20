import type { SupabaseClient } from "@supabase/supabase-js";

export const INBOX_LIST_NAME = "Inbox";
export const INBOX_LIST_ICON = "📥";
export const DEFAULT_INBOX_GROUP_NAME = "Inbox";
export const DEFAULT_INBOX_GROUP_COLOR = "#64748b";

export type InboxListRecord = {
  id: string;
  user_id: string;
  group_id: string;
  name: string;
  icon: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export async function getOrCreateInboxListForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<InboxListRecord | null> {
  const { data: existingInboxLists, error: existingInboxError } = await supabase
    .from("lists")
    .select("*")
    .eq("user_id", userId)
    .eq("name", INBOX_LIST_NAME)
    .order("created_at", { ascending: true })
    .limit(1);

  if (existingInboxError) {
    console.error("Error fetching inbox list:", existingInboxError);
    return null;
  }

  if (existingInboxLists && existingInboxLists.length > 0) {
    return existingInboxLists[0] as InboxListRecord;
  }

  const { data: firstGroupRows, error: firstGroupError } = await supabase
    .from("groups")
    .select("id")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .limit(1);

  if (firstGroupError) {
    console.error("Error fetching first group for inbox:", firstGroupError);
    return null;
  }

  let targetGroupId = firstGroupRows?.[0]?.id ?? null;

  if (!targetGroupId) {
    const { data: createdGroup, error: createGroupError } = await supabase
      .from("groups")
      .insert({
        user_id: userId,
        name: DEFAULT_INBOX_GROUP_NAME,
        color: DEFAULT_INBOX_GROUP_COLOR,
        sort_order: 0,
      })
      .select("*")
      .single();

    if (createGroupError || !createdGroup) {
      console.error("Error creating default inbox group:", createGroupError);
      return null;
    }

    targetGroupId = createdGroup.id;
  }

  const { data: existingLists } = await supabase
    .from("lists")
    .select("sort_order")
    .eq("group_id", targetGroupId)
    .eq("user_id", userId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const maxOrder = existingLists?.[0]?.sort_order ?? -1;

  const { data: createdInboxList, error: createInboxError } = await supabase
    .from("lists")
    .insert({
      user_id: userId,
      group_id: targetGroupId,
      name: INBOX_LIST_NAME,
      icon: INBOX_LIST_ICON,
      sort_order: maxOrder + 1,
    })
    .select("*")
    .single();

  if (createInboxError || !createdInboxList) {
    console.error("Error creating inbox list:", createInboxError);
    return null;
  }

  return createdInboxList as InboxListRecord;
}
