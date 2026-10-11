import { parseClassification } from "./classification-response.ts";

Deno.test("aceita prioridade valida e preserva justificativa", () => {
  const result = parseClassification(JSON.stringify({ priority: "alta", reason: "  Risco de queda.  " }));
  if (result.priority !== "alta" || result.reason !== "Risco de queda.") throw new Error("Resposta incorreta");
});

Deno.test("rejeita resposta truncada, prioridade livre e motivo ausente", () => {
  const invalid = [
    '{"priority":"alta",', 'PRIORIDADE: ALTA', 'null', '[]',
    '{"priority":"talvez alta","reason":"Risco"}',
    '{"priority":"alta","reason":" "}', '{"priority":"alta"}',
    JSON.stringify({ priority: "baixa", reason: "x".repeat(201) }),
    JSON.stringify({ priority: "media", reason: "Motivo", status: "Concluído" }),
  ];
  for (const raw of invalid) {
    let rejected = false;
    try { parseClassification(raw); } catch { rejected = true; }
    if (!rejected) throw new Error(`Aceitou resposta inválida: ${raw}`);
  }
});
