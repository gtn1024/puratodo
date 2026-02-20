import { api } from "./client";
import type { Group, ApiResponse } from "@puratodo/api-types";

// Client-specific input types (backend adds user_id automatically)
export interface CreateGroupInput {
  name: string;
  color?: string;
}

export interface UpdateGroupInput {
  name?: string;
  color?: string;
  sort_order?: number;
}

export type { Group };

export const groupsApi = {
  async list(): Promise<Group[]> {
    const response = await api.get<ApiResponse<Group[]>>("/api/v1/groups");
    return response.data ?? [];
  },

  async create(input: CreateGroupInput): Promise<Group> {
    const response = await api.post<ApiResponse<Group>>("/api/v1/groups", input);
    return response.data!;
  },

  async update(id: string, input: UpdateGroupInput): Promise<Group> {
    const response = await api.patch<ApiResponse<Group>>(`/api/v1/groups/${id}`, input);
    return response.data!;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/v1/groups/${id}`);
  },
};
