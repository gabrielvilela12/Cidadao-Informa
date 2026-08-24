const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const MODEL = "google/gemini-3.7-flash";

export interface ClassifyRequest {
  description: string;
  category: string;
}

export interface ClassifyResponse {
  priority: "baixa" | "media" | "alta" | "critica";
  /** Justificativa curta da classificacao. null quando o modelo nao devolveu. */
  reason: string | null;
  rawResponse: string;
}

export async function classifyPriority(
  request: ClassifyRequest
): Promise<ClassifyResponse> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

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
  // Preserva o texto original: o motivo precisa da capitalizacao intacta.
  const rawResponse = data.choices[0]?.message?.content?.trim() || "";

  // Le a prioridade da linha rotulada. O fallback para o texto inteiro mantem
  // compatibilidade com o formato antigo, que respondia so uma palavra.
  const priority = parsePriority(extractLabeledValue(rawResponse, "PRIORIDADE") ?? rawResponse);
  if (!priority) {
    throw new Error(`Invalid priority response from LLM: ${rawResponse}`);
  }

  const reason = extractLabeledValue(rawResponse, "MOTIVO");

  return {
    priority,
    reason: reason ? reason.slice(0, 500) : null,
    rawResponse,
  };
}

/** Extrai o valor de uma linha no formato "ROTULO: valor". */
function extractLabeledValue(text: string, label: string): string | null {
  const match = text.match(new RegExp(`^\\s*${label}\\s*:\\s*(.+)$`, "im"));
  const value = match?.[1]?.trim();
  return value ? value : null;
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

FORMATO DA RESPOSTA (exatamente duas linhas, sem markdown):
PRIORIDADE: <CRÍTICA, ALTA, MÉDIA ou BAIXA>
MOTIVO: <uma frase curta, no máximo 200 caracteres, explicando o critério aplicado>

Exemplo:
PRIORIDADE: ALTA
MOTIVO: Vários buracos em via principal, com impacto operacional em muitos usuários.`;
}

function parsePriority(
  response: string
): "baixa" | "media" | "alta" | "critica" | null {
  const normalized = response
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized.includes("critica")) return "critica";
  if (normalized.includes("alta")) return "alta";
  if (normalized.includes("media")) return "media";
  if (normalized.includes("baixa")) return "baixa";
  return null;
}
