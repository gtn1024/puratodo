// Realtime subscription hook for Tauri app
// Similar to web app's useRealtime but uses Tauri Supabase client

import { useEffect, useRef } from "react";
import { getSupabaseClient, initializeSupabaseClient } from "@/lib/supabase/client";

interface RealtimeConfig {
  channel: string;
  table: string;
  onInsert?: (payload: unknown) => void;
  onUpdate?: (payload: unknown) => void;
  onDelete?: (payload: unknown) => void;
  enabled?: boolean;
}

export function useRealtime({
  channel,
  table,
  onInsert,
  onUpdate,
  onDelete,
  enabled = true,
}: RealtimeConfig) {
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabaseClient>["channel"]> | null>(null);
  const handlersRef = useRef({
    onInsert,
    onUpdate,
    onDelete,
  });

  // Keep handlers up to date
  useEffect(() => {
    handlersRef.current = {
      onInsert,
      onUpdate,
      onDelete,
    };
  }, [onInsert, onUpdate, onDelete]);

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    async function setupSubscription() {
      // Initialize Supabase client
      const supabase = await initializeSupabaseClient();
      if (!supabase || !mounted) return;

      const channelInstance = supabase
        .channel(channel)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table,
          },
          (payload) => {
            const handlers = handlersRef.current;

            switch (payload.eventType) {
              case "INSERT":
                handlers.onInsert?.(payload.new);
                break;
              case "UPDATE":
                handlers.onUpdate?.(payload.new);
                break;
              case "DELETE":
                handlers.onDelete?.(payload.old);
                break;
            }
          }
        )
        .subscribe();

      channelRef.current = channelInstance;
    }

    setupSubscription();

    return () => {
      mounted = false;
      if (channelRef.current) {
        const supabase = getSupabaseClient();
        if (supabase) {
          supabase.removeChannel(channelRef.current);
        }
        channelRef.current = null;
      }
    };
  }, [channel, table, enabled]);
}

// Hook to subscribe to all task changes
export function useTaskRealtime(onChange: () => void, enabled = true) {
  useRealtime({
    channel: "tasks-realtime",
    table: "tasks",
    onInsert: onChange,
    onUpdate: onChange,
    onDelete: onChange,
    enabled,
  });
}

// Hook to subscribe to all list changes
export function useListRealtime(onChange: () => void, enabled = true) {
  useRealtime({
    channel: "lists-realtime",
    table: "lists",
    onInsert: onChange,
    onUpdate: onChange,
    onDelete: onChange,
    enabled,
  });
}

// Hook to subscribe to all group changes
export function useGroupRealtime(onChange: () => void, enabled = true) {
  useRealtime({
    channel: "groups-realtime",
    table: "groups",
    onInsert: onChange,
    onUpdate: onChange,
    onDelete: onChange,
    enabled,
  });
}
