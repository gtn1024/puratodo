import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getGroups, type Group } from "@/actions/groups";
import { DashboardContent } from "./dashboard-content";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const groups = await getGroups();

  return <DashboardContent initialGroups={groups} />;
}
