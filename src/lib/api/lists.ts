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

export interface ListsResponse {
  lists: List[];
}

export interface ListResponse {
  list: List;
}

export const listsApi = {
  async list(): Promise<List[]> {
    const response = await api.get<ListsResponse>("/api/v1/lists");
    return response.lists;
  },

  async create(input: CreateListInput): Promise<List> {
    const response = await api.post<ListResponse>("/api/v1/lists", input);
    return response.list;
  },

  async update(id: string, input: UpdateListInput): Promise<List> {
    const response = await api.patch<ListResponse>(`/api/v1/lists/${id}`, input);
    return response.list;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/v1/lists/${id}`);
  },
};
