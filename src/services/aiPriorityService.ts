import { supabase } from './supabase';

interface AiPriorityResponse {
  priority: 'baixa' | 'media' | 'alta' | 'critica' | null;
  aiStatus: 'pending' | 'success' | 'failed';
  errorMessage?: string;
}

interface ManualPriorityPayload {
  priority: 'baixa' | 'media' | 'alta' | 'critica';
  reason?: string;
}

export const aiPriorityService = {
  async getPriority(protocolId: string): Promise<AiPriorityResponse> {
    const { data, error } = await supabase
      .from('protocols')
      .select('ai_priority, ai_status')
      .eq('id', protocolId)
      .single();

    if (error) throw error;

    return {
      priority: data.ai_priority as any,
      aiStatus: data.ai_status,
    };
  },

  async setManualPriority(
    protocolId: string,
    priority: string,
    reason?: string
  ): Promise<void> {
    const response = await fetch(
      `/api/ai-priority/manual/${protocolId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priority,
          reason,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to set priority: ${response.statusText}`);
    }
  },

  async regeneratePriority(protocolId: string): Promise<void> {
    const response = await fetch(
      `/api/ai-priority/regenerate/${protocolId}`,
      {
        method: 'POST',
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to regenerate priority: ${response.statusText}`
      );
    }
  },

  async getAuditLogs(days: number = 7): Promise<any[]> {
    const response = await fetch(
      `/api/ai-priority/logs?days=${days}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch logs: ${response.statusText}`);
    }

    return response.json();
  },

  async getFailedJobs(): Promise<any[]> {
    const response = await fetch(`/api/ai-priority/jobs/failed`);

    if (!response.ok) {
      throw new Error(`Failed to fetch failed jobs: ${response.statusText}`);
    }

    return response.json();
  },
};
