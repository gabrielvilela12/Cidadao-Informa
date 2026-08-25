import { createClient } from "supabase";

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") ?? "";
const MODEL = "google/gemini-3.7-flash";
const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ai-function-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequestPayload {
  message: string;
  history?: ChatMessage[];
  context?: {
    currentRoute?: string;
    userRole?: string;
  };
}

interface KnowledgeChunk {
  id: string;
  title: string;
  keywords: string[];
  content: string;
  route?: string;
}

const KNOWLEDGE_BASE: KnowledgeChunk[] = [
  {
    id: "sobre-plataforma",
    title: "O que é o Cidadão Informa",
    keywords: ["sobre", "plataforma", "cidadao informa", "o que e", "quem somos", "como funciona", "ajuda", "sistema", "inicio"],
    content: "O Cidadão Informa é o canal digital oficial e gratuito para qualquer morador pedir consertos e melhorias para a sua rua ou bairro (como buracos no asfalto, lâmpadas apagadas, podas de árvores perigosas, lixo na rua e bueiros entupidos), com acompanhamento de cada etapa pelo número do protocolo.",
    route: "/",
  },
  {
    id: "servicos-pedidos",
    title: "Problemas que você pode relatar",
    keywords: ["servicos", "categorias", "buraco", "iluminacao", "poste", "lampada", "arvore", "poda", "lixo", "entulho", "calcada", "bueiro", "asfalto"],
    content: "Principais serviços: 1. Buracos na rua ou asfalto quebrado; 2. Iluminação pública (lâmpada queimada ou poste apagado); 3. Poda de árvores (galhos encostando na fiação ou com risco de queda); 4. Lixo e entulho acumulados; 5. Calçadas danificadas e rampas quebradas; 6. Bueiros entupidos com risco de alagamento; 7. Placas de trânsito e semáforos; 8. Outros consertos na cidade.",
    route: "/servicos",
  },
  {
    id: "como-abrir-pedido",
    title: "Como abrir um pedido de conserto",
    keywords: ["como abrir", "nova solicitacao", "criar chamado", "abrir protocolo", "reclamar", "registrar", "pedir conserto"],
    content: "Para abrir um pedido: acesse /nova-solicitacao, escolha o problema, descreva o que está acontecendo, marque o endereço ou ponto no mapa, envie até 4 fotos do local e clique em 'Enviar'. Você receberá um código de protocolo (#BR-2026-XXXXX) na hora para acompanhar.",
    route: "/nova-solicitacao",
  },
  {
    id: "acompanhar-pedido",
    title: "Como acompanhar seu pedido de conserto",
    keywords: ["acompanhar", "meus protocolos", "meus pedidos", "status", "aberto", "em analise", "concluido", "atrasado"],
    content: "Na página /meus-protocolos você vê todos os seus pedidos e o status: 'Aberto' (recebido pela prefeitura), 'Em Análise' (equipe avaliando o local para envio das obras), 'Concluído' (serviço finalizado com sucesso!) e 'Atrasado' (aguardando atendimento na fila). Você também pode ver fotos e a simulação de como o local ficará corrigido.",
    route: "/meus-protocolos",
  },
  {
    id: "mapa-cidade",
    title: "Como ver os problemas no Mapa da Cidade",
    keywords: ["mapa", "mapa da cidade", "onde fica", "pontos no mapa", "ver no mapa"],
    content: "Na página /mapa você pode ver todos os problemas relatados na cidade em um mapa interativo, com filtros por tipo de serviço e status.",
    route: "/mapa",
  },
  {
    id: "transparencia-obras",
    title: "Portal de Transparência",
    keywords: ["transparencia", "portal de transparencia", "gastos", "gastos publicos", "obras", "dinheiro", "prestacao de contas"],
    content: "O Portal de Transparência (/transparencia) é público e aberto para qualquer pessoa ver o total de chamados atendidos na cidade, a taxa de problemas resolvidos e os valores investidos em obras e zeladoria pela prefeitura.",
    route: "/transparencia",
  },
  {
    id: "acessibilidade-facil",
    title: "Acessibilidade e facilidade de leitura",
    keywords: ["acessibilidade", "aumentar letra", "tamanho da fonte", "alto contraste", "modo escuro", "leitor de tela"],
    content: "O site possui ferramentas para facilitar a leitura de todos: botões para aumentar ou diminuir a letra, modo de Alto Contraste, Modo Escuro e suporte a leitores de tela.",
    route: "/acessibilidade",
  },
  {
    id: "duvidas-comuns",
    title: "Dúvidas Frequentes",
    keywords: ["duvidas", "gratuito", "paga", "telefone", "cadastro", "vizinho", "compartilhar"],
    content: "O serviço é 100% público e gratuito. Você pode compartilhar seu pedido com vizinhos pelo link público (/p/:id). Para atualizar seu telefone para receber avisos, acesse /perfil.",
    route: "/perfil",
  },
];

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function retrieveKnowledge(query: string): { contextText: string; topics: string[] } {
  const normQuery = normalize(query);
  const tokens = normQuery.split(/[\s,.;:!?]+/).filter((t) => t.length > 2);

  const scored = KNOWLEDGE_BASE.map((chunk) => {
    let score = 0;
    const normTitle = normalize(chunk.title);
    const normContent = normalize(chunk.content);

    for (const kw of chunk.keywords) {
      const normKw = normalize(kw);
      if (normQuery.includes(normKw)) score += 15;
      for (const token of tokens) {
        if (normKw.includes(token)) score += 4;
      }
    }
    for (const token of tokens) {
      if (normTitle.includes(token)) score += 6;
      if (normContent.includes(token)) score += 1;
    }
    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 3).map((s) => s.chunk);

  const contextText = top
    .map((c) => `[DOCUMENTO: ${c.title}]\n${c.content}\nLink direto: ${c.route || "/"}`)
    .join("\n\n");

  return { contextText, topics: top.map((t) => t.title) };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const SYSTEM_PROMPT = `Você é o "Assistente Cidadão IA", o atendente virtual do site Cidadão Informa.

SEU PÚBLICO:
- Moradores e cidadãos comuns, leigos em termos técnicos.
- Fale sempre com linguagem simples, acolhedora, clara e fácil de entender.
- Explique o passo a passo de forma didática, sem termos difíceis.

O QUE VOCÊ EXPLICA:
- Como abrir pedidos de conserto para a rua (buracos, iluminação, poda de árvores, lixo, calçadas, bueiros).
- Como consultar o andamento do pedido pelo número de protocolo.
- Como navegar pelo mapa da cidade.
- Como conferir a transparência das obras municipais.
- Como usar os recursos de acessibilidade (aumentar letra, modo escuro).

REGRAS DE ESCOPO:
1. Você responde EXCLUSIVAMENTE sobre o Cidadão Informa e problemas da cidade atendidos pela plataforma.
2. É ESTRITAMENTE PROIBIDO responder sobre assuntos não relacionados (receitas, piadas, futebol, política partidária externa, programação, previsões, etc.).
3. Se perguntarem algo fora de escopo, responda com simpatia:
   "Desculpe! Eu sou o assistente do Cidadão Informa e posso ajudar você apenas com dúvidas sobre os serviços da sua cidade (como buracos na rua, iluminação, poda de árvores, bueiros e acompanhamento de protocolos). Como posso ajudar você hoje?"
4. Responda em Português do Brasil (pt-BR) com frases curtas e formatação amigável em tópicos.`;

async function getManagedPrompt(agentKey: string, fallback: string): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return fallback;
  try {
    const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await client
      .from("ai_prompts")
      .select("prompt_text")
      .eq("agent_key", agentKey)
      .maybeSingle();
    if (error) throw error;
    return data?.prompt_text?.trim() || fallback;
  } catch (error) {
    console.warn(`Unable to load managed prompt for ${agentKey}`, error);
    return fallback;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  try {
    const payload = (await req.json()) as ChatRequestPayload;
    const userMessage = payload.message?.trim();

    if (!userMessage) {
      return jsonResponse({ success: false, error: "Mensagem vazia." }, 400);
    }

    const { contextText, topics } = retrieveKnowledge(userMessage);
    const managedSystemPrompt = await getManagedPrompt("chatbot", SYSTEM_PROMPT);

    // Se a chave não estiver configurada no Edge Function, retorna resposta local RAG com alto padrão
    if (!OPENROUTER_API_KEY) {
      const defaultReply = `Olá! Sou o Assistente do Cidadão Informa.\n\nCom base na sua dúvida sobre **${topics[0] || "serviços da cidade"}**:\n\n${contextText}\n\nComo posso ajudar você mais?`;
      return jsonResponse({
        success: true,
        reply: defaultReply,
        model: MODEL,
        topics,
        fallback: true,
      });
    }

    const messages = [
      {
        role: "system",
        content: `${managedSystemPrompt}\n\n--- INFORMAÇÕES DA PLATAFORMA (RAG) ---\n${contextText}\n\nContexto da sessão: Rota atual: ${payload.context?.currentRoute || "/"}`,
      },
    ];

    if (Array.isArray(payload.history) && payload.history.length > 0) {
      const recentHistory = payload.history.slice(-6).map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      }));
      messages.push(...recentHistory);
    }

    messages.push({
      role: "user",
      content: userMessage,
    });

    const response = await fetch(OPENROUTER_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://cidadaoinforma.app",
        "X-Title": "Cidadao Informa - Assistente Virtual",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        max_tokens: 800,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter chat error:", errorText);
      throw new Error(`OpenRouter responded with status ${response.status}`);
    }

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content?.trim() ||
      "Desculpe, não consegui processar a resposta no momento. Por favor, tente novamente.";

    return jsonResponse({
      success: true,
      reply,
      model: MODEL,
      topics,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Chat assistant error:", errorMsg);
    return jsonResponse(
      {
        success: false,
        error: "Não foi possível consultar o assistente virtual no momento.",
      },
      500
    );
  }
});
