import { apiRequest } from './http';

type Priority = 'baixa' | 'media' | 'alta' | 'critica';

interface AiPriorityResponse {
  priority: Priority | null;
  aiStatus: 'pending' | 'success' | 'failed';
  errorMessage?: string;
}

interface ApiAuditLog {
  id: string;
  protocolId: string;
  priority: Priority;
  source: string;
  adminId?: string | null;
  previousPriority?: string | null;
  reason?: string | null;
  createdAt: string;
}

export const aiPriorityService = {
  getPriority(protocolId: string): Promise<AiPriorityResponse> {
    return apiRequest(`/api/ai-priority/${encodeURIComponent(protocolId)}`);
  },

  async setManualPriority(
    protocolId: string,
    priority: string,
    reason?: string,
  ): Promise<void> {
    await apiRequest(`/api/ai-priority/manual/${encodeURIComponent(protocolId)}`, {
      method: 'PUT',
      body: JSON.stringify({ priority, reason }),
    });
  },

  async regeneratePriority(protocolId: string): Promise<void> {
    await apiRequest(`/api/ai-priority/regenerate/${encodeURIComponent(protocolId)}`, {
      method: 'POST',
    });
  },

  async getAuditLogs(days: number = 7): Promise<any[]> {
    const logs = await apiRequest<ApiAuditLog[]>(
      `/api/ai-priority/logs?days=${encodeURIComponent(days)}`,
    );

    return logs.map((log) => ({
      ...log,
      protocol_id: log.protocolId,
      admin_id: log.adminId,
      previous_priority: log.previousPriority,
      created_at: log.createdAt,
    }));
  },

  getFailedJobs(): Promise<any[]> {
    return apiRequest('/api/ai-priority/jobs/failed');
  },
};
