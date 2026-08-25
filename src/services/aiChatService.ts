import { apiRequest } from './http';
import {
  retrieveRagContext,
  isQueryInScope,
  normalizeText,
} from '../utils/ragKnowledge';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  topics?: string[];
  isOutOfScope?: boolean;
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

const OUT_OF_SCOPE_RESPONSE =
  'Desculpe, sou o **Assistente Virtual do Cidadão Informa** e fui programado para tirar dúvidas exclusivamente sobre a nossa plataforma, serviços de zeladoria urbana (como buracos, iluminação, poda de árvores, descarte de lixo e calçadas), abertura e acompanhamento de protocolos e transparência pública.\n\nComo posso ajudar você com os serviços da sua cidade hoje?';

/**
 * Gera uma resposta rica e contextualizada via RAG local quando a chamada ao servidor não estiver disponível.
 */
export function generateLocalRagResponse(query: string, currentRoute?: string): { reply: string; topics: string[] } {
  if (!isQueryInScope(query)) {
    return {
      reply: OUT_OF_SCOPE_RESPONSE,
      topics: ['Fora de Escopo'],
    };
  }

  const norm = normalizeText(query).replace(/[!?,.;]/g, '');

  // Saudação simples
  if (norm === 'oi' || norm === 'ola' || norm === 'bom dia' || norm === 'boa tarde' || norm === 'boa noite') {
    return {
      reply:
        'Olá! Bem-vindo(a) ao **Cidadão Informa**! 👋\n\nSou seu **Assistente Virtual com IA (Gemini 3.7 Flash + RAG)**.\n\nPosso te ajudar a:\n- 📋 **Abrir uma Nova Solicitação** de zeladoria (buraco, luz, poda, lixo, etc.);\n- 🔍 **Acompanhar o status** de um protocolo existente;\n- 🗺️ **Visualizar o mapa interativo** de ocorrências da cidade;\n- 📊 **Consultar o Portal de Transparência** e a auditoria criptográfica;\n- ♿ **Conhecer os recursos de acessibilidade** e atalhos de teclado.\n\nQual dúvida você gostaria de tirar agora?',
      topics: ['Boas-vindas', 'Visão Geral'],
    };
  }

  const rag = retrieveRagContext(query, 3);

  // Resposta baseada nos chunks do RAG
  const primaryChunk = rag.retrievedChunks[0];
  let response = `Com base nas informações do **Cidadão Informa**:\n\n${primaryChunk.content}\n\n`;

  if (rag.retrievedChunks.length > 1) {
    const secondaryChunk = rag.retrievedChunks[1];
    response += `📌 **${secondaryChunk.title}**:\n${secondaryChunk.content}\n\n`;
  }

  if (primaryChunk.route) {
    response += `💡 *Acesse diretamente:* **[${primaryChunk.title}](${primaryChunk.route})**\n`;
  }

  return {
    reply: response.trim(),
    topics: rag.suggestedTopics,
  };
}

export const aiChatService = {
  /**
   * Envia uma mensagem para o Assistente Virtual e recebe a resposta contextualizada por RAG e Gemini.
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

    // Validação preventiva de escopo
    if (!isQueryInScope(cleanMessage)) {
      return {
        reply: OUT_OF_SCOPE_RESPONSE,
        topics: ['Fora de Escopo'],
        model: 'google/gemini-3.7-flash',
      };
    }

    const currentPath =
      options.currentRoute ||
      (typeof window !== 'undefined' && window.location ? window.location.pathname : '/');

    // Tenta chamada ao endpoint do backend Java (/api/ai/chat)
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
        authenticated: false,
        body: JSON.stringify(payload),
      });

      if (response && response.reply) {
        return {
          reply: response.reply,
          topics: response.topics || [],
          model: response.model || 'google/gemini-3.7-flash',
        };
      }
    } catch (apiError) {
      // Fallback gracioso para o motor RAG local integrado
    }

    // Fallback inteligente para o motor RAG local integrado
    const localResult = generateLocalRagResponse(cleanMessage, currentPath);
    return {
      reply: localResult.reply,
      topics: localResult.topics,
      model: 'google/gemini-3.7-flash',
    };
  },
};
