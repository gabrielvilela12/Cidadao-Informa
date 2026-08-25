import { apiRequest } from './http';

export type AiAgentKey = 'chatbot' | 'priority' | 'image';

export interface AiPrompt {
  id: string;
  agentKey: AiAgentKey;
  name: string;
  description: string;
  promptText: string;
  version: number;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const aiPromptService = {
  list(): Promise<AiPrompt[]> {
    return apiRequest('/api/admin/ai-prompts');
  },

  update(agentKey: AiAgentKey, promptText: string): Promise<AiPrompt> {
    return apiRequest(`/api/admin/ai-prompts/${encodeURIComponent(agentKey)}`, {
      method: 'PUT',
      body: JSON.stringify({ promptText }),
    });
  },
};
