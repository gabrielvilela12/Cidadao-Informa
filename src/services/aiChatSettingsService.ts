import { apiRequest } from './http';

export interface AiChatSettings {
  establishmentId: string;
  establishmentName: string;
  chatEnabled: boolean;
}

export const aiChatSettingsService = {
  get: () => apiRequest<AiChatSettings>('/api/admin/ai-chat-settings'),

  update: (chatEnabled: boolean) => apiRequest<AiChatSettings>('/api/admin/ai-chat-settings', {
    method: 'PATCH',
    body: JSON.stringify({ chatEnabled }),
  }),
};
