# Classificação de prioridade com justificativa

A função recebe categoria e descrição e retorna prioridade e motivo. O modelo não recebe CPF, telefone, nome ou endereço residencial no payload enviado por este cliente. A descrição é texto livre: o formulário não garante que o cidadão deixe de inserir dados pessoais; a minimização desse conteúdo permanece uma limitação.

O cliente solicita JSON Schema com duas propriedades obrigatórias: `priority` e `reason`. A prioridade deve ser `baixa`, `media`, `alta` ou `critica`, e a justificativa deve possuir entre 1 e 200 caracteres após remoção de espaços externos. Mesmo com schema no provedor, o retorno passa por validação local. Respostas truncadas, JSON inválido, campos extras e motivos vazios são rejeitados.

O limite de saída passou de 10 para 256 tokens. Provedores precisam suportar o formato estruturado; `require_parameters` impede encaminhamento a um endpoint que ignore os parâmetros. Falhas continuam seguindo o fluxo de jobs e reprocessamento; não concluem o protocolo.

## Configuração no ambiente da Edge Function

- `OPENROUTER_API_KEY`: credencial do provedor, somente no servidor.
- `OPENROUTER_PRIORITY_MODEL`: modelo opcional, com suporte a saída estruturada. Sem configuração, mantém o modelo já utilizado pelo projeto.
- Variáveis Supabase já usadas pela função para persistência.

A justificativa fica na tabela existente `ai_job_logs`. O endpoint Java `GET /api/ai-priority/{protocolId}` retorna a prioridade, o estado, o motivo e a origem do registro mais recente compatível com a prioridade atual, após a autorização já existente.

Prompts gerenciados anteriores continuam fornecendo critérios, mas a mensagem de sistema e o contrato estruturado definem o formato final. Revisar prompts personalizados após publicação.

## Verificação local

Na raiz do projeto, em PowerShell:

```powershell
deno check --config supabase/functions/classify-priority/deno.json supabase/functions/classify-priority/index.ts
$env:OPENROUTER_API_KEY = 'test-only'
deno test --allow-env=OPENROUTER_API_KEY,OPENROUTER_PRIORITY_MODEL supabase/functions/classify-priority/classification-response_test.ts supabase/functions/classify-priority/openrouter-client_test.ts
```

O valor `test-only` serve exclusivamente ao teste com `fetch` simulado. Os testes não acionam OpenRouter nem gravam no banco.

## Limitações e estado de publicação

Uma explicação do modelo não comprova que a decisão está correta. É necessário manter revisão humana e avaliar exemplos representativos. O serviço tem custo e depende da disponibilidade e do suporte do provedor escolhido.

Nesta etapa, o código e os testes locais foram preparados. A nova versão não foi publicada no Supabase e ainda não foi comprovada por uma chamada real ao modelo. Registros antigos sem motivo continuam exibindo ausência de justificativa, sem explicações fabricadas.

Referência: [saídas estruturadas no OpenRouter](https://openrouter.ai/docs/guides/features/structured-outputs).
