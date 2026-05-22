const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const MODEL = "google/gemini-2.5-flash";

export interface ClassifyRequest {
  description: string;
  category: string;
}

export interface ClassifyResponse {
  priority: "baixa" | "media" | "alta" | "critica";
  rawResponse: string;
}

export async function classifyPriority(
  request: ClassifyRequest
): Promise<ClassifyResponse> {
  const prompt = buildPrompt(request.category, request.description);

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://cidadaoinforma.app",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 10,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `OpenRouter API error (${response.status}): ${error}`
    );
  }

  const data = await response.json();
  const rawResponse =
    data.choices[0]?.message?.content?.trim().toUpperCase() || "";

  const priority = parsePriority(rawResponse);
  if (!priority) {
    throw new Error(`Invalid priority response from LLM: ${rawResponse}`);
  }

  return {
    priority,
    rawResponse,
  };
}

function buildPrompt(category: string, description: string): string {
  return `Você é um classificador de prioridade de solicitações de zeladoria urbana.

CATEGORIAS E CRITÉRIOS DE PRIORIDADE:

**CRÍTICA** (ameaça imediata à segurança/saúde pública):
- Buraco grande que pode causar acidentes graves
- Iluminação totalmente apagada em via movimentada à noite
- Deslizamento de terra ou risco de desabamento
- Acúmulo de lixo que atrai vetores/risco biológico imediato

**ALTA** (problema que afeta muitos ou causa impacto operacional):
- Múltiplos buracos em via principal
- Iluminação intermitente/falha em zona comercial
- Entupimento de bueiro/alagamento em via
- Poda de árvore que bloqueia semáforo/sinalização

**MÉDIA** (problema localizado, solução rotineira):
- Buraco pequeno em via secundária
- Iluminação fraca mas funcional
- Poda de árvore que cresce sobre muro
- Lixo espalhado (sem risco biológico imediato)

**BAIXA** (problema cosmético/menor impacto):
- Pixação em muro/poste
- Mato crescendo em calçada
- Lixeira cheia (sem transbordamento)
- Placa suja/desgastada

---

DADOS DO CHAMADO:
Categoria: ${category}
Descrição: ${description}

Responda APENAS com UMA palavra: CRÍTICA, ALTA, MÉDIA ou BAIXA

Não adicione explicações, apenas a prioridade.`;
}

function parsePriority(
  response: string
): "baixa" | "media" | "alta" | "critica" | null {
  const normalized = response.toLowerCase();
  if (normalized.includes("crítica")) return "critica";
  if (normalized.includes("alta")) return "alta";
  if (normalized.includes("média")) return "media";
  if (normalized.includes("media")) return "media";
  if (normalized.includes("baixa")) return "baixa";
  return null;
}
