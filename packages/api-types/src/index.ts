// Database Types - extracted from apps/web/src/lib/supabase/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      lists: {
        Row: {
          id: string;
          user_id: string;
          group_id: string;
          name: string;
          icon: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          group_id: string;
          name: string;
          icon?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          group_id?: string;
          name?: string;
          icon?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          list_id: string;
          parent_id: string | null;
          name: string;
          completed: boolean;
          starred: boolean;
          due_date: string | null;
          plan_date: string | null;
          comment: string | null;
          duration_minutes: number | null;
          recurrence_frequency: string | null;
          recurrence_interval: number | null;
          recurrence_weekdays: number[] | null;
          recurrence_end_date: string | null;
          recurrence_end_count: number | null;
          recurrence_rule: string | null;
          recurrence_timezone: string | null;
          recurrence_source_task_id: string | null;
          remind_at: string | null;
          reminder_sent_at: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          list_id: string;
          parent_id?: string | null;
          name: string;
          completed?: boolean;
          starred?: boolean;
          due_date?: string | null;
          plan_date?: string | null;
          comment?: string | null;
          duration_minutes?: number | null;
          recurrence_frequency?: string | null;
          recurrence_interval?: number | null;
          recurrence_weekdays?: number[] | null;
          recurrence_end_date?: string | null;
          recurrence_end_count?: number | null;
          recurrence_rule?: string | null;
          recurrence_timezone?: string | null;
          recurrence_source_task_id?: string | null;
          remind_at?: string | null;
          reminder_sent_at?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          list_id?: string;
          parent_id?: string | null;
          name?: string;
          completed?: boolean;
          starred?: boolean;
          due_date?: string | null;
          plan_date?: string | null;
          comment?: string | null;
          duration_minutes?: number | null;
          recurrence_frequency?: string | null;
          recurrence_interval?: number | null;
          recurrence_weekdays?: number[] | null;
          recurrence_end_date?: string | null;
          recurrence_end_count?: number | null;
          recurrence_rule?: string | null;
          recurrence_timezone?: string | null;
          recurrence_source_task_id?: string | null;
          remind_at?: string | null;
          reminder_sent_at?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Table-specific types
export type Group = Tables<"groups">;
export type List = Tables<"lists">;
export type Task = Tables<"tasks">;
// Extended Task type with nested subtasks (client-side computed)
export type TaskWithSubtasks = Task & {
  subtasks?: TaskWithSubtasks[];
};

// TaskSearchResult - Task with list and group context for calendar/search
export type TaskSearchResult = Task & {
  list_name: string;
  list_icon: string;
  group_name: string;
  group_color: string;
};

export type GroupInsert = InsertTables<"groups">;
export type ListInsert = InsertTables<"lists">;
export type TaskInsert = InsertTables<"tasks">;

export type GroupUpdate = UpdateTables<"groups">;
export type ListUpdate = UpdateTables<"lists">;
export type TaskUpdate = UpdateTables<"tasks">;

// API Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Adapter interfaces
export * from './adapters';
