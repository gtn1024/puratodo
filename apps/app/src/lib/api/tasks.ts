import { api } from "./client";
import type { Task, ApiResponse } from "@puratodo/api-types";

export type { Task };

// Client-specific input types
export interface CreateTaskInput {
  list_id: string;
  name: string;
  parent_id?: string | null;
}

export interface UpdateTaskInput {
  name?: string;
  completed?: boolean;
  starred?: boolean;
  due_date?: string | null;
  plan_date?: string | null;
  comment?: string | null;
  duration_minutes?: number | null;
  sort_order?: number;
}

export const tasksApi = {
  async list(): Promise<Task[]> {
    const response = await api.get<ApiResponse<Task[]>>("/api/v1/tasks");
    return response.data ?? [];
  },

  async create(input: CreateTaskInput): Promise<Task> {
    const response = await api.post<ApiResponse<Task>>("/api/v1/tasks", input);
    return response.data!;
  },

  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    const response = await api.patch<ApiResponse<Task>>(`/api/v1/tasks/${id}`, input);
    return response.data!;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/v1/tasks/${id}`);
  },
};
