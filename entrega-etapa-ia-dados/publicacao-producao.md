# Publicação em produção — 10/10/2026

Publicação solicitada pelo integrante responsável pelo repositório.

## Aplicação

- Repositório: https://github.com/gabrielvilela12/Cidadao-Informa.
- Branch: `main`; commit funcional: `a282e9f632321648ad7637bffbf86e2ec27a5157`.
- Projeto Vercel: `cidadao-informa`, com frontend Vite e API Java em container.
- Deployment: `dpl_8TbAVpQ491cgXV4o9mT2DYi4sVM2`, estado `READY`, destino `production`.
- Endereço: https://cidadao-informa.vercel.app.
- A publicação foi disparada automaticamente pelo push. Não houve migração de schema.

## IA e ajuste identificado em produção

A função `classify-priority` foi publicada no Supabase HackGov. A primeira chamada da versão 12 rejeitou a resposta por truncamento. O limite intermediário de 256 tokens também era consumido pelo raciocínio interno do Gemini. Consultados o catálogo público do OpenRouter e a documentação sobre `max_tokens`, foi mantido o modelo do projeto, com esforço `low` e limite de 2048 tokens. O limite de 200 caracteres da justificativa e a validação do JSON continuam obrigatórios.

A versão 13 ficou `ACTIVE`, com `verify_jwt: true`. Os três testes Deno e a checagem de tipos passaram novamente após o ajuste.

Referência: https://openrouter.ai/docs/guides/best-practices/reasoning-tokens.

## Evidências reais

Às 23h47 de 10/10/2026, a função retornou HTTP 200 para o protocolo de demonstração `demo-bulk-protocol-rp-193`, usando sua categoria e descrição já existentes. Prioridade: `alta`. Justificativa:

> A ausência de rampa de acessibilidade impede a locomoção de cadeirantes e pessoas com mobilidade reduzida, gerando impacto operacional relevante no direito de ir e vir.

Confirmados no PostgreSQL: protocolo e job com estado `success`, prioridade `alta` e justificativa em `ai_job_logs`, origem `ia`. O teste criou o job e o registro de classificação desse protocolo demonstrativo; a prioridade permaneceu igual. Não foram modificados relatos de cidadãos reais.

Verificações HTTP no domínio público após a publicação:

- `GET /api/health`: HTTP 200, `status: ok`.
- Login com servidor demonstrativo: aprovado.
- `GET /api/admin/analytics`, período 01/08 a 10/10/2026: HTTP 200; 351 relatos no escopo de Ribeirão Preto, 102 concluídos, 29,06%, custo total R$ 29.520,00, cobertura de custos 96/102.
- `GET /api/ai-priority/demo-bulk-protocol-rp-193`: HTTP 200, `aiStatus: success`, justificativa e origem `ia` conferidas.

As métricas anteriores de São Paulo possuem escopo diferente. Tempo médio continua indisponível para a base demonstrativa sem datas confiáveis de resolução.

## Entrega acadêmica

As evidências técnicas não substituem os PDFs, os slides com identificação dos integrantes, o vídeo de até cinco minutos e o ZIP exigidos pela FIAP. Esses artefatos ainda precisam ser consolidados.

Os arquivos locais da apresentação/PDF/ZIP da Fase 5 já existentes antes desta atividade foram preservados e não foram incluídos no commit funcional.
