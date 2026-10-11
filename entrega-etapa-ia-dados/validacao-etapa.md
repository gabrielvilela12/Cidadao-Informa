# Validação da etapa

Verificações realizadas em 10/10/2026.

## Atualização do repositório

Foi executado `git pull --ff-only origin main`. Resultado: `Already up to date`, na revisão `5e933f3`. As alterações locais de apresentação, PDF, ZIP e contexto foram preservadas por stash temporário e restauradas sem conflitos.

Não houve commit, push, publicação da aplicação ou deployment da Edge Function neste incremento.

## Verificações automatizadas

| Verificação | Resultado |
| --- | --- |
| `npm run lint` | Aprovado: verificação TypeScript. |
| `npm run test` | 118 testes aprovados em 9 arquivos. |
| `npm run build` | Aprovado. Avisos de tamanho do bundle e importações dinâmicas/estáticas permanecem. |
| `mvn test -q` com teste PostgreSQL habilitado | 111 testes aprovados, sem falhas, erros ou testes ignorados. |
| `mvn package -q -DskipTests` | Empacotamento aprovado para a execução local. |
| `deno check --config supabase/functions/classify-priority/deno.json supabase/functions/classify-priority/index.ts` | Aprovado usando o import map existente da função. |
| Testes Deno do parser e cliente com `fetch` simulado | 3 testes aprovados, sem chamada real ao provedor. |
| `git diff --check` | Sem erros de whitespace após ajuste. |

### Teste PostgreSQL isolado

`OperationalAnalyticsDatabaseTest` usa conexão JDBC configurada localmente, cria uma tabela temporária `protocols` no schema temporário da sessão e executa as consultas reais da aplicação sobre uma fixture. A transação termina com rollback. Não modifica os protocolos persistentes do projeto.

Cenários comprovados: prefeitura diferente, UF diferente, escopo global, UFs vazias, exclusão lógica, último instante do dia final, primeiro instante fora do intervalo, conclusão de chamado criado antes do período, custo e data ausentes, ranking e meses sem registros.

Para executar novamente a partir de `backend-java`, com `.env.local` configurado na raiz:

```powershell
$env:HACKGOV_ANALYTICS_DB_TESTS = 'true'
mvn test -q
```

Sem essa variável, o teste de banco é ignorado, e os demais testes podem ser executados normalmente. A fixture exige permissão para criar tabelas temporárias.

## Verificação do fluxo de ponta a ponta

História: o servidor aplica um período no Dashboard Executivo; o React solicita os indicadores à API Java, que agrega dados autorizados no PostgreSQL e devolve os resultados à tela.

Ambiente: API local em `http://localhost:5210`, frontend local em `http://localhost:3001`. A API foi iniciada sem Flyway e sem agendamentos para evitar migrações e tarefas automáticas no banco compartilhado durante a verificação.

| Fronteira | Evidência |
| --- | --- |
| Interface | Login demonstrativo de servidor RP e exibição do bloco de análise. |
| React → API | O formulário aplica o período e atualiza os valores retornados pela rota administrativa. |
| API → PostgreSQL | Consultas SQL executadas pelo JDBC; valores conferidos também por chamada HTTP e consultas no banco. |
| PostgreSQL → resposta | HTTP retornou total 351, 102 concluídos, taxa 29,06%, custo total R$ 29.520,00 e cobertura de custo 96/102 para RP. |
| Resposta → tela | O navegador exibiu esses indicadores, distribuição, série mensal e ranking de Ribeirão Preto. |

### Cenários no navegador

- Período inicial até 10/10/2026: 351 registros de RP, sem mistura com São Paulo.
- De 01/09/2026 a 10/10/2026: 201 registros, 60 concluídos, taxa 29,85%, custo total R$ 16.545,00, média R$ 300,82 e cobertura 55/60.
- De 01/07/2026 a 31/07/2026: zero registros, mensagem de ausência, médias sem dados e série mensal com zero.
- Detalhe de protocolo demonstrativo: seção de prioridade consultada, com fallback explícito para registro antigo sem justificativa.
- Console do navegador no detalhe: nenhum erro capturado na verificação.

### Respostas HTTP verificadas

- Consulta administrativa com servidor demo: `200`.
- Consulta sem sessão: `401`.
- Consulta com cidadão demo: `403`.
- Consulta com período invertido: `400`.

## Limites da verificação de IA

Foi validado o contrato enviado ao provedor com `fetch` simulado, incluindo schema, exigência de suporte a parâmetros e limite de saída. Foram testados retorno válido, motivo ausente, campos extras, prioridade inválida, JSON incompleto e truncamento informado pelo provedor. O backend foi testado para devolver motivo compatível com a prioridade atual e registrar falha de chamada para reprocessamento.

A nova Edge Function não foi publicada. A chave OpenRouter não está configurada no ambiente local inspecionado, e não houve uma nova classificação real pelo modelo. Assim, não se declara validada a nova geração completa no ambiente remoto. Essa evidência permanece pendente para o vídeo e a entrega.
