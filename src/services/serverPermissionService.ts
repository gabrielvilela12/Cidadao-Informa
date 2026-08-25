import { apiRequest } from './http';

export interface ServerPermission {
  userId: string;
  name: string;
  email: string;
  role: AdminRole;
  createdAt: string;
  states: string[];
  screens: AdminScreenPermission[];
}

export type AdminScreenPermission = 'CITIZENS' | 'USER_MANAGEMENT' | 'REPORTS' | 'AI';
export type AdminRole = 'admin' | 'master';

export interface AdminAccessProfile {
  states: string[];
  screens: string[];
}

export interface CreateAdminInput {
  name: string;
  email: string;
  cpf: string;
  password: string;
  role: AdminRole;
  states: string[];
  screens: AdminScreenPermission[];
}

export const serverPermissionService = {
  list(): Promise<ServerPermission[]> {
    return apiRequest('/api/admin/server-permissions');
  },

  myAccess(): Promise<AdminAccessProfile> {
    return apiRequest('/api/admin/access/me');
  },

  create(input: CreateAdminInput): Promise<ServerPermission> {
    return apiRequest('/api/admin/server-permissions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  update(userId: string, role: AdminRole, states: string[], screens: AdminScreenPermission[]): Promise<ServerPermission> {
    return apiRequest(`/api/admin/server-permissions/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      body: JSON.stringify({ role, states, screens }),
    });
  },
};
