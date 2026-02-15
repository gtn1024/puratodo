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
