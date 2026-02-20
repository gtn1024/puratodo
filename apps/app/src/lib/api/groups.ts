import { api } from "./client";

export interface Group {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateGroupInput {
  name: string;
  color?: string;
}

export interface UpdateGroupInput {
  name?: string;
  color?: string;
  sort_order?: number;
}

// Backend API response wrapper
interface ApiDataResponse<T> {
  success: boolean;
  data: T;
}

export const groupsApi = {
  async list(): Promise<Group[]> {
    const response = await api.get<ApiDataResponse<Group[]>>("/api/v1/groups");
    return response.data;
  },

  async create(input: CreateGroupInput): Promise<Group> {
    const response = await api.post<ApiDataResponse<Group>>("/api/v1/groups", input);
    return response.data;
  },

  async update(id: string, input: UpdateGroupInput): Promise<Group> {
    const response = await api.patch<ApiDataResponse<Group>>(`/api/v1/groups/${id}`, input);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/v1/groups/${id}`);
  },
};
