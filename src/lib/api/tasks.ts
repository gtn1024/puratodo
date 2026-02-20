import { api } from "./client";

export interface Task {
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
}

interface ApiDataResponse<T> {
  success: boolean;
  data: T;
}

export const tasksApi = {
  async list(): Promise<Task[]> {
    const response = await api.get<ApiDataResponse<Task[]>>("/api/v1/tasks");
    return response.data;
  },
};
