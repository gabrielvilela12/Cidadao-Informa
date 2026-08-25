import { apiRequest } from './http';

export interface ServerPermission {
  userId: string;
  name: string;
  email: string;
  createdAt: string;
  states: string[];
}

export const serverPermissionService = {
  list(): Promise<ServerPermission[]> {
    return apiRequest('/api/admin/server-permissions');
  },

  update(userId: string, states: string[]): Promise<ServerPermission> {
    return apiRequest(`/api/admin/server-permissions/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      body: JSON.stringify({ states }),
    });
  },
};
