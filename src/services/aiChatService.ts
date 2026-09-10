import { apiRequest, ApiError } from './http';
import {
  retrieveRagContext,
  isQueryInScope,
} from '../utils/ragKnowledge';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  topics?: string[];
}

export interface SendMessageOptions {
  currentRoute?: string;
  userRole?: string;
}

export interface ChatApiResponse {
  success: boolean;
  reply: string;
  model?: string;
  topics?: string[];
  error?: string;
}

const MODEL = 'google/gemini-3.7-flash';

/**
 * Fallback dinâmico contextualizado quando não há conexão ativa com a API.
 */
function buildDynamicFallback(query: string, currentRoute?: string): { reply: string; topics: string[] } {
  if (!isQueryInScope(query)) {
    return {
      reply:
        'Olá! Sou o **Assistente Cidadão**.\n\nEstou aqui para ajudar você com os serviços da sua cidade (como buracos no asfalto, iluminação pública, poda de árvores, descarte de lixo, bueiros e acompanhamento de protocolos).\n\nComo posso ajudar você com algum problema na sua rua ou bairro hoje?',
      topics: ['Ajuda ao Morador'],
    };
  }

  const rag = retrieveRagContext(query, 2);
  const primaryChunk = rag.retrievedChunks[0];
  const secondaryChunk = rag.retrievedChunks[1];

  let reply = `Olá! Posso te ajudar com isso:\n\n${primaryChunk.content}\n\n`;

  if (secondaryChunk && secondaryChunk.id !== primaryChunk.id) {
    reply += `📌 **${secondaryChunk.title}**:\n${secondaryChunk.content}\n\n`;
  }

  if (primaryChunk.route) {
    reply += `👉 **[Clique aqui para acessar ${primaryChunk.title}](${primaryChunk.route})**\n`;
  }

  return {
    reply: reply.trim(),
    topics: rag.suggestedTopics,
  };
}

export const aiChatService = {
  /**
   * Envia uma mensagem para o Assistente Virtual e obtém a resposta da IA (Gemini 3.7 Flash + RAG).
   */
  async sendMessage(
    message: string,
    history: ChatMessage[] = [],
    options: SendMessageOptions = {}
  ): Promise<{ reply: string; topics: string[]; model: string }> {
    const cleanMessage = message.trim();
    if (!cleanMessage) {
      throw new Error('A mensagem não pode ser vazia.');
    }

    const currentPath =
      options.currentRoute ||
      (typeof window !== 'undefined' && window.location ? window.location.pathname : '/');

    // 1. Recupera o contexto RAG correspondente à pergunta
    const rag = retrieveRagContext(cleanMessage, 3);
    // 2. Toda chamada paga passa pelo backend, que identifica o assinante,
    // reserva saldo e registra o custo real. Visitantes usam somente o RAG local.
    const hasBillableTenantSession = typeof localStorage !== 'undefined'
      && Boolean(localStorage.getItem('cidadaoinforma_token'))
      && options.userRole !== 'platform_owner';
    if (hasBillableTenantSession) {
      try {
        const payload = {
          message: cleanMessage,
          history: history.slice(-6).map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          context: {
            currentRoute: currentPath,
            userRole: options.userRole || 'visitor',
          },
        };

        const response = await apiRequest<ChatApiResponse>('/api/ai/chat', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        if (response && response.reply && response.reply.trim()) {
          return {
            reply: response.reply.trim(),
            topics: response.topics || rag.suggestedTopics,
            model: response.model || MODEL,
          };
        }
      } catch (backendError) {
        if (backendError instanceof ApiError && backendError.userFacing) {
          throw backendError;
        }
      }
    }

    // 3. Fallback local gratuito
    const fallback = buildDynamicFallback(cleanMessage, currentPath);
    return {
      reply: fallback.reply,
      topics: fallback.topics,
      model: MODEL,
    };
  },
};
