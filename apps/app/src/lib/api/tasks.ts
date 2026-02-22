import { api } from "./client";
import type { Task, TaskSearchResult, ApiResponse } from "@puratodo/api-types";

export type { Task, TaskSearchResult };

// Client-specific input types
export interface CreateTaskInput {
  list_id: string;
  name: string;
  parent_id?: string | null;
}

export interface UpdateTaskInput {
  list_id?: string;
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

  /**
   * Get tasks within a date range for calendar view
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format
   * @param listId - Optional list ID to filter by
   * @returns Array of tasks with list/group context
   */
  async getTasksInDateRange(
    startDate: string,
    endDate: string,
    listId?: string
  ): Promise<TaskSearchResult[]> {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });

    if (listId) {
      params.append("listId", listId);
    }

    const response = await api.get<ApiResponse<TaskSearchResult[]>>(
      `/api/v1/tasks/date-range?${params.toString()}`
    );
    return response.data ?? [];
  },

  /**
   * Get unscheduled tasks (incomplete tasks with no plan_date)
   * @param listId - Optional list ID to filter by
   * @returns Array of unscheduled tasks with list/group context
   */
  async getUnscheduledTasks(listId?: string): Promise<TaskSearchResult[]> {
    const params = new URLSearchParams();

    if (listId) {
      params.append("listId", listId);
    }

    const response = await api.get<ApiResponse<TaskSearchResult[]>>(
      `/api/v1/tasks/unscheduled?${params.toString()}`
    );
    return response.data ?? [];
  },
};
