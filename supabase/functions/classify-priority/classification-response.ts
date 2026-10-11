export type Priority = "baixa" | "media" | "alta" | "critica";

export const classificationSchema = {
  name: "protocol_priority",
  strict: true,
  schema: {
    type: "object",
    properties: {
      priority: { type: "string", enum: ["baixa", "media", "alta", "critica"] },
      reason: { type: "string", description: "Justificativa em português, de 1 a 200 caracteres." },
    },
    required: ["priority", "reason"],
    additionalProperties: false,
  },
};

/** Validacao local continua obrigatoria mesmo quando o provedor aplica o schema. */
export function parseClassification(rawResponse: string): { priority: Priority; reason: string } {
  let value: unknown;
  try {
    value = JSON.parse(rawResponse);
  } catch {
    throw new Error("A IA retornou uma classificação fora do formato JSON esperado.");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Classificação inválida: objeto esperado.");
  }
  const result = value as Record<string, unknown>;
  if (Object.keys(result).some((key) => !["priority", "reason"].includes(key)) ||
    typeof result.priority !== "string" ||
    !["baixa", "media", "alta", "critica"].includes(result.priority) ||
    typeof result.reason !== "string" || !result.reason.trim() || result.reason.trim().length > 200) {
    throw new Error("Classificação inválida: prioridade ou justificativa incompatível com o contrato.");
  }
  return { priority: result.priority as Priority, reason: result.reason.trim() };
}
