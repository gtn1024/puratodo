import { api } from "./client";

export interface List {
  id: string;
  user_id: string;
  group_id: string;
  name: string;
  icon: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

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

// Backend API response wrapper
interface ApiDataResponse<T> {
  success: boolean;
  data: T;
}

export const listsApi = {
  async list(): Promise<List[]> {
    const response = await api.get<ApiDataResponse<List[]>>("/api/v1/lists");
    return response.data;
  },

  async create(input: CreateListInput): Promise<List> {
    const response = await api.post<ApiDataResponse<List>>("/api/v1/lists", input);
    return response.data;
  },

  async update(id: string, input: UpdateListInput): Promise<List> {
    const response = await api.patch<ApiDataResponse<List>>(`/api/v1/lists/${id}`, input);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/v1/lists/${id}`);
  },

  async move(id: string, group_id: string): Promise<List> {
    const response = await api.patch<ApiDataResponse<List>>(`/api/v1/lists/${id}/move`, { group_id });
    return response.data;
  },
};
