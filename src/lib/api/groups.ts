import { api } from "./client";

export interface Group {
  id: string;
  user_id: string;
  name: string;
  color: string;
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

export interface GroupsResponse {
  groups: Group[];
}

export interface GroupResponse {
  group: Group;
}

export const groupsApi = {
  async list(): Promise<Group[]> {
    const response = await api.get<GroupsResponse>("/api/v1/groups");
    return response.groups;
  },

  async create(input: CreateGroupInput): Promise<Group> {
    const response = await api.post<GroupResponse>("/api/v1/groups", input);
    return response.group;
  },

  async update(id: string, input: UpdateGroupInput): Promise<Group> {
    const response = await api.patch<GroupResponse>(`/api/v1/groups/${id}`, input);
    return response.group;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/v1/groups/${id}`);
  },
};
