import { api } from "./client";
import type { List, ApiResponse } from "@puratodo/api-types";

export type { List };

// Client-specific input types
export interface CreateListInput {
  group_id: string;
  name: string;
  icon?: string;
}

export interface UpdateListInput {
  name?: string;
  icon?: string;
  group_id?: string;
  sort_order?: number;
}

export const listsApi = {
  async list(): Promise<List[]> {
    const response = await api.get<ApiResponse<List[]>>("/api/v1/lists");
    return response.data ?? [];
  },

  async create(input: CreateListInput): Promise<List> {
    const response = await api.post<ApiResponse<List>>("/api/v1/lists", input);
    return response.data!;
  },

  async update(id: string, input: UpdateListInput): Promise<List> {
    const response = await api.patch<ApiResponse<List>>(`/api/v1/lists/${id}`, input);
    return response.data!;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/v1/lists/${id}`);
  },

  async move(id: string, group_id: string): Promise<List> {
    const response = await api.patch<ApiResponse<List>>(`/api/v1/lists/${id}/move`, { group_id });
    return response.data!;
  },
};
