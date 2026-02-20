"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

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
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const handlersRef = useRef({
    onInsert,
    onUpdate,
    onDelete,
  });

  if (!supabaseRef.current) {
    supabaseRef.current = createClient();
  }

  useEffect(() => {
    handlersRef.current = {
      onInsert,
      onUpdate,
      onDelete,
    };
  }, [onInsert, onUpdate, onDelete]);

  useEffect(() => {
    const supabase = supabaseRef.current;
    if (!enabled || !supabase) return;

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

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [channel, table, enabled]);
}

// Hook to subscribe to all task changes for a specific list
export function useTaskRealtime(listId: string | null, onChange: () => void) {
  useRealtime({
    channel: `tasks-${listId || "all"}`,
    table: "tasks",
    onInsert: onChange,
    onUpdate: onChange,
    onDelete: onChange,
    enabled: !!listId,
  });
}

// Hook to subscribe to all list changes
export function useListRealtime(onChange: () => void) {
  useRealtime({
    channel: "lists-changes",
    table: "lists",
    onInsert: onChange,
    onUpdate: onChange,
    onDelete: onChange,
  });
}

// Hook to subscribe to all group changes
export function useGroupRealtime(onChange: () => void) {
  useRealtime({
    channel: "groups-changes",
    table: "groups",
    onInsert: onChange,
    onUpdate: onChange,
    onDelete: onChange,
  });
}
