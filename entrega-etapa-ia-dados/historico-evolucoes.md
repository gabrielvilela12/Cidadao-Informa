# Histórico de evoluções — IA e análise de dados

Este arquivo registra incrementos realizados nesta etapa. Funcionalidades encontradas no código anterior são contexto, e não devem ser contadas automaticamente como novas implementações.

## 10/10/2026 — Registro inicial do contexto

### Solicitação

O grupo pediu que arquivos `.md` fossem criados e atualizados durante o trabalho para recuperar posteriormente o que foi realizado nesta etapa.

### Trabalho realizado

- Leitura inicial dos documentos anteriores e dos trechos relacionados a banco, classificação de prioridade e recorrência.
- Registro do escopo proposto: análises SQL integradas, justificativa da IA e otimização do agrupamento.
- Criação das histórias US27 a US31 com critérios de aceitação.
- Organização dos requisitos da entrega e das regras para manter o histórico.

### Arquivos criados

- `entrega-etapa-ia-dados/contexto-etapa.md`
- `entrega-etapa-ia-dados/backlog-etapa.md`
- `entrega-etapa-ia-dados/historico-evolucoes.md`

### Estado técnico

Somente documentação inicial criada. Nenhuma alteração funcional, migração, execução de SQL ou chamada de IA realizada neste incremento. Não houve validação da aplicação em execução nem execução de testes funcionais.

### Achados para os próximos incrementos

- Classificador de prioridade pede motivo, mas possui limite de saída de 10 tokens; risco de justificativa truncada.
- Metadados do agrupamento ordenam os membros para escolher o protocolo principal; é possível buscar o mínimo preservando o desempate.
- Já existem agregações no repositório de protocolos, mas é necessário preparar e executar as consultas específicas desta atividade, com resultados reproduzíveis.

### Pendências

- Implementar e validar US27 a US30.
- Comprovar as funcionalidades existentes que serão apresentadas.
- Obter resultados SQL efetivos e registrar suas interpretações.
- Reunir nomes, RMs, fotos e link do vídeo para a entrega final.

## 10/10/2026 — Atualização da main e primeiro incremento funcional

### Atualização do repositório

Executado `git pull --ff-only origin main`: a branch já estava atualizada na revisão `5e933f3`. As alterações locais da apresentação, PDF, ZIP e dos arquivos de contexto foram guardadas por stash temporário e restauradas sem conflitos.

### US30 — Busca do protocolo principal

O cálculo dos metadados do grupo passou de uma cópia ordenada para busca do mínimo pelo comparador de data e ID. Testes conferem desempate, entrada fora de ordem, grupos e limiares existentes. A complexidade do trecho passa de O(m log m) para O(m), sem alegação de latência medida.

Arquivos principais: `ProtocolLocationGroupService.java` e seu teste.

### US29 — Justificativa da prioridade

- Adicionado JSON Schema para prioridade e motivo, validação local estrita e rejeição de respostas truncadas.
- Limite de saída ampliado de 10 para 256 tokens; seleção do modelo pode ser configurada no servidor.
- API de prioridade retorna a justificativa e a origem do log mais recente compatível com a prioridade atual.
- Tela de prioridade mostra motivo, distingue revisão manual e permite reprocessar falhas.
- Falha ao acionar a Edge Function é registrada como falha do job e do protocolo, evitando estado pendente indefinido.
- Persistência de resultado e justificativa verifica os erros devolvidos pelo Supabase.
- Registros anteriores sem motivo exibem a ausência de justificativa, sem conteúdo inventado.

Arquivos principais: `classification-response.ts`, `openrouter-client.ts`, `classify-priority/index.ts`, `AiPriorityService.java`, `AiJobLogRepository.java`, `aiPriorityService.ts` e `PrioritySection.tsx`, além dos testes e README da função.

Limitação: a nova Edge Function não foi publicada e não foi chamada com o provedor real. O contrato e o tratamento de respostas foram testados com simulação; a publicação e a comprovação do fluxo remoto continuam pendentes.

### US27 e US28 — Indicadores em SQL

- Criados quatro scripts SQL parametrizados para resumo, distribuição, série mensal e ranking.
- Implementadas agregações, CTEs, `DENSE_RANK`, datas por fuso e preenchimento de meses vazios.
- Acrescentados repositório JDBC, serviço autorizado, DTO e endpoint administrativo.
- Integrado bloco de análise ao Dashboard Executivo, com período próprio, cobertura das médias e estados de carregamento, erro e ausência.
- Resultados conferidos no banco, em teste JDBC isolado, por HTTP e no navegador.

Arquivos principais: `backend-java/src/main/resources/analytics/*.sql`, `OperationalAnalyticsRepository.java`, `OperationalAnalyticsService.java`, `OperationalAnalyticsController.java`, `OperationalAnalyticsOutputDto.java`, `operationalAnalyticsService.ts`, `OperationalAnalyticsPanel.tsx` e `AdminDashboard.tsx`.

### Resultados e verificações

- Base de demonstração de São Paulo: 352 protocolos, 102 concluídos, taxa 28,98%, custos informados em 96 conclusões, soma R$ 29.520,00 e média R$ 307,50.
- Limitação identificada: ausência de datas válidas de resolução no histórico concluído, impedindo cálculo real de duração e conclusões mensais.
- Navegação local do servidor RP: 351 protocolos; filtro a partir de setembro retorna 201. Julho retorna estado vazio corretamente.
- HTTP: servidor autorizado `200`, sem sessão `401`, cidadão `403` e período invertido `400`.
- 111 testes Java aprovados, incluindo PostgreSQL com tabela temporária e rollback; 118 testes frontend e 3 testes Deno aprovados.
- TypeScript, build frontend e verificação Deno com o import map existente aprovados.
- Ajustes durante a validação: arquivos Deno usam o sufixo `_test.ts` para não serem executados pelo Vitest; verificação da função usa seu `deno.json`; removida linha vazia excedente identificada por `git diff --check`.

### Documentação e evidências

Criados `analise-sql-e-eficiencia.md`, `validacao-etapa.md`, `evidencias/resultados-sql.json` e `sql/consultas-demonstracao.sql`. Atualizados contexto e backlog. Não houve migração, alteração de dados persistentes, commit, push ou publicação neste incremento.

### Pendências para a entrega

- Publicar e validar a nova Edge Function com uma classificação real.
- Preparar a demonstração das novas conclusões com datas válidas, distinguindo-a do histórico sem datas.
- Consolidar a comparação com a última entrega, o documento final, slides, vídeo e ZIP.
- Reunir nomes completos, RMs, fotos e link não listado do vídeo.

## 10/10/2026 — Reexecução das consultas SQL solicitada pelo grupo

As quatro consultas da etapa foram executadas novamente no PostgreSQL do projeto, às 23h41 (America/Sao_Paulo), para a base de demonstração de São Paulo, entre 01/08/2026 e 10/10/2026. Elas foram reunidas em uma única instrução SELECT para compartilhar a mesma fotografia dos dados. Não houve migração ou alteração de registros.

Resultados confirmados: 352 protocolos, 102 concluídos, taxa de conclusão de 28,98%, custo total registrado de R$ 29.520,00, custo médio de R$ 307,50 e 96 concluídos com custo informado. Datas válidas de resolução continuam ausentes nos 102 concluídos.

A soma da distribuição por categoria/status e das entradas mensais confere com o total de protocolos; a contagem de concluídos na distribuição também confere com o resumo. Ranking e série mensal foram retornados com sucesso.

Evidência: `evidencias/resultados-sql-reexecucao.json`. A publicação e validação real da nova função de IA continuam pendentes; esta execução SQL não publica a Edge Function.

## Modelo para registrar o próximo incremento

Copiar a estrutura abaixo e preencher somente com informações verificadas:

```markdown
## DD/MM/AAAA — Título do incremento

### História e problema
ID da história e necessidade atendida.

### Mudança implementada
Comportamento anterior e comportamento resultante.

### Arquivos e integração
Caminhos dos arquivos, consultas e contratos alterados.

### Verificação e resultado
Comandos executados, cenários, resultados e evidências.
Indicar separadamente verificações pendentes ou limitações do ambiente.

### Contribuição para a atividade
Partes do enunciado atendidas e interpretação dos resultados.

### Pendências
Trabalho necessário antes de considerar o incremento concluído.
```
