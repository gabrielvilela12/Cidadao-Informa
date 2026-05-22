import { supabase } from './supabase';

interface AiPriorityResponse {
  priority: 'baixa' | 'media' | 'alta' | 'critica' | null;
  aiStatus: 'pending' | 'success' | 'failed';
  errorMessage?: string;
}

const EDGE_URL = import.meta.env.VITE_EDGE_FUNCTION_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

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
      aiStatus: data.ai_status ?? 'pending',
    };
  },

  async setManualPriority(
    protocolId: string,
    priority: string,
    reason?: string
  ): Promise<void> {
    const { error: protocolError } = await supabase
      .from('protocols')
      .update({ ai_priority: priority, ai_status: 'success' })
      .eq('id', protocolId);

    if (protocolError) throw protocolError;

    const { error: logError } = await supabase
      .from('ai_job_logs')
      .insert({ protocol_id: protocolId, priority, source: 'admin_manual', reason: reason ?? null });

    if (logError) throw logError;
  },

  async regeneratePriority(protocolId: string): Promise<void> {
    const { data: protocol, error } = await supabase
      .from('protocols')
      .select('description, category')
      .eq('id', protocolId)
      .single();

    if (error || !protocol) throw new Error('Protocolo não encontrado');

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? ANON_KEY;

    const response = await fetch(EDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        protocol_id: protocolId,
        description: protocol.description,
        category: protocol.category,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Edge Function falhou: ${text}`);
    }
  },

  async getAuditLogs(days: number = 7): Promise<any[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await supabase
      .from('ai_job_logs')
      .select('*')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async getFailedJobs(): Promise<any[]> {
    const { data, error } = await supabase
      .from('ai_priority_jobs')
      .select('*')
      .eq('status', 'failed')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },
};
