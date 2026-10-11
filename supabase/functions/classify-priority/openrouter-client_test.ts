import { classifyPriority } from "./openrouter-client.ts";

Deno.test("envia schema e preserva explicacao; rejeita truncamento do provedor", async () => {
  // Este teste deve ser executado com OPENROUTER_API_KEY=test-only; nao chama a rede.
  const originalFetch = globalThis.fetch;
  let truncated = false;
  globalThis.fetch = (_input, init) => {
    const body = JSON.parse(String(init?.body));
    if (body.max_tokens !== 2048 || body.reasoning?.effort !== "low" ||
      body.reasoning?.exclude !== true || body.response_format?.type !== "json_schema" ||
      body.provider?.require_parameters !== true || body.messages?.[0]?.role !== "system") {
      throw new Error("Contrato enviado ao provedor incorreto");
    }
    return Promise.resolve(new Response(JSON.stringify({ choices: [{
      finish_reason: truncated ? "length" : "stop",
      message: { content: JSON.stringify({ priority: "alta", reason: "Risco para pedestres." }) },
    }] }), { status: 200 }));
  };
  try {
    const result = await classifyPriority({ category: "Física", description: "Buraco na calçada" });
    if (result.reason !== "Risco para pedestres." || result.priority !== "alta") throw new Error("Resultado incorreto");
    truncated = true;
    let rejected = false;
    try { await classifyPriority({ category: "Física", description: "Buraco" }); } catch { rejected = true; }
    if (!rejected) throw new Error("Aceitou resposta truncada");
  } finally { globalThis.fetch = originalFetch; }
});
