import { supabase } from './supabase';

type Priority = 'baixa' | 'media' | 'alta' | 'critica';

interface AiPriorityResponse {
  priority: Priority | null;
  aiStatus: 'pending' | 'success' | 'failed';
  errorMessage?: string;
}

interface ClassifyProtocolPayload {
  protocolId: string;
  description: string;
  category: string;
}

async function getFunctionErrorMessage(error: unknown): Promise<string> {
  if (
    error &&
    typeof error === 'object' &&
    'context' in error &&
    (error as { context?: unknown }).context instanceof Response
  ) {
    return await (error as { context: Response }).context.text();
  }

  return error instanceof Error ? error.message : String(error);
}

export const aiPriorityService = {
  async classifyProtocol({
    protocolId,
    description,
    category,
  }: ClassifyProtocolPayload): Promise<AiPriorityResponse> {
    const { data, error } = await supabase.functions.invoke('classify-priority', {
      body: {
        protocol_id: protocolId,
        description,
        category,
      },
    });

    if (error) {
      const message = await getFunctionErrorMessage(error);
      throw new Error(`Edge Function falhou: ${message}`);
    }

    if (!data?.success) {
      throw new Error(data?.error ?? 'Classificação de IA não retornou sucesso.');
    }

    return {
      priority: data.priority as Priority,
      aiStatus: 'success',
    };
  },

  async getPriority(protocolId: string): Promise<AiPriorityResponse> {
    const { data, error } = await supabase
      .from('protocols')
      .select('ai_priority, ai_status')
      .eq('id', protocolId)
      .single();

    if (error) throw error;

    return {
      priority: data.ai_priority as Priority | null,
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

    await this.classifyProtocol({
      protocolId,
      description: protocol.description,
      category: protocol.category,
    });
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
