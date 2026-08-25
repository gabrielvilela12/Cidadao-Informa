import { apiRequest } from './http';
import {
  retrieveRagContext,
  CHATBOT_SYSTEM_PROMPT,
  normalizeText,
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

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-3.7-flash';

/**
 * Chamada direta ao OpenRouter com Gemini 3.7 Flash no cliente se a chave estiver presente no ambiente Vite.
 */
async function callOpenRouterDirectly(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[]
): Promise<string> {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6).map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://cidadaoinforma.app',
      'X-Title': 'Cidadao Informa - Assistente Virtual',
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.35,
      max_tokens: 800,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter returned status ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

/**
 * Fallback dinâmico contextualizado quando não há conexão ativa com a API.
 */
function buildDynamicFallback(query: string, currentRoute?: string): { reply: string; topics: string[] } {
  if (!isQueryInScope(query)) {
    return {
      reply:
        'Olá! Sou o **Assistente Virtual do Cidadão Informa**.\n\nFui programado exclusivamente para ajudar você com os serviços e demandas da sua cidade (como buracos no asfalto, iluminação pública, poda de árvores, descarte de lixo, bueiros e acompanhamento de protocolos).\n\nComo posso ajudar você com algum problema na sua rua ou bairro hoje?',
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
    const fullSystemPrompt = `${CHATBOT_SYSTEM_PROMPT}

--- BASE DE CONHECIMENTO DO CIDADÃO INFORMA (RAG) ---
${rag.formattedContext}

--- CONTEXTO DO MORADOR ---
Página atual do site: ${currentPath}
Perfil: ${options.userRole || 'morador/visitante'}

INSTRUÇÃO IMPORTANTE:
- Pense e responda de forma natural, acolhedora e inteligente.
- Se a pergunta for sobre um chamado, serviço ou dúvida do site, forneça a orientação passo a passo com base no RAG.
- Se a pergunta for sobre um assunto fora de escopo (culinária, futebol, piadas, programação, etc.), recuse educadamente com empatia e simpatia, e convide o cidadão a tirar dúvidas sobre os problemas da cidade.`;

    // 2. Tenta chamar o Backend Java (/api/ai/chat)
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

      if (response && response.reply && response.reply.trim()) {
        return {
          reply: response.reply.trim(),
          topics: response.topics || rag.suggestedTopics,
          model: response.model || MODEL,
        };
      }
    } catch (backendError) {
      // Backend Java indisponível, tenta métodos diretos
    }

    // 3. Tenta chamada direta ao OpenRouter / Gemini se houver chave no Vite env
    const viteKey =
      (typeof import.meta !== 'undefined' && import.meta.env
        ? (import.meta.env.VITE_OPENROUTER_API_KEY as string) || (import.meta.env.VITE_GEMINI_API_KEY as string)
        : '') || '';

    if (viteKey) {
      try {
        const directReply = await callOpenRouterDirectly(
          viteKey,
          fullSystemPrompt,
          cleanMessage,
          history
        );
        if (directReply) {
          return {
            reply: directReply,
            topics: rag.suggestedTopics,
            model: MODEL,
          };
        }
      } catch (openRouterError) {
        console.warn('Erro ao consultar OpenRouter diretamente:', openRouterError);
      }
    }

    // 4. Fallback dinâmico contextualizado
    const fallback = buildDynamicFallback(cleanMessage, currentPath);
    return {
      reply: fallback.reply,
      topics: fallback.topics,
      model: MODEL,
    };
  },
};
