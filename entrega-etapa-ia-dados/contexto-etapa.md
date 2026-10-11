# Contexto da etapa — IA e análise de dados

## Objetivo

Evoluir o Cidadão Informa, desenvolvido para o HackGov/FIAP, com melhorias em análise SQL, inteligência artificial e eficiência no processamento de protocolos. Estes arquivos servirão de base para explicar o trabalho realizado e preparar a documentação, os slides e o vídeo da entrega.

## Orientação do grupo

Em 10/10/2026, foi combinado registrar o contexto em arquivos Markdown durante o desenvolvimento. Atualizar os registros conforme as mudanças forem implementadas e verificadas, distinguindo planejamento, implementação e validação.

O número oficial desta fase ainda não foi informado. A pasta utiliza um nome descritivo para não confundir esta atividade com as entregas anteriores.

## Requisitos da atividade

1. Relatar as evoluções desde a última entrega.
2. Atualizar o Product Backlog com histórias de integração entre frontend, backend e banco, incluindo critérios de aceitação das histórias prioritárias.
3. Identificar, justificar e iniciar uma evolução com IA ou IoT, ou explicar uma funcionalidade dessas tecnologias já implementada e funcionando. Apresentar problema, tecnologia, dados, integração, benefícios e limitações.
4. Executar consultas SQL com agrupamentos, totais ou métricas e pelo menos uma subconsulta ou função avançada; apresentar resultados e interpretar as informações. Demonstrar uma aplicação de busca, organização, ordenação ou relacionamento de dados e explicar sua complexidade.

## Base identificada no código

- Frontend React/TypeScript, API Java/Spring Boot e PostgreSQL no Supabase.
- Classificação de prioridade por IA, chatbot e simulação de correção de imagens.
- Agrupamento de protocolos por local e causa, com alertas de recorrência.
- Mapas, indicadores, relatórios, controle de acesso e auditoria.
- Exclusão lógica de protocolos e data de conclusão.

Esses pontos foram identificados por leitura do código e dos documentos. A execução dos fluxos de IA e as consultas no banco ainda precisam de validação nesta etapa; a existência do código não comprova funcionamento no ambiente de entrega.

## Escopo combinado

### Análise SQL integrada ao painel administrativo

Calcular no PostgreSQL e apresentar pelo fluxo banco → API Java → React:

- quantidade de protocolos por categoria e status;
- taxa de conclusão e tempo médio de atendimento;
- custo total e médio dos protocolos concluídos;
- ranking de locais com mais relatos;
- evolução mensal das solicitações.

Usar agrupamentos e agregações e incluir subconsulta e/ou função de janela. Registrar os resultados efetivamente obtidos, os filtros, a cobertura dos dados e a interpretação. Não inventar valores ou apresentar dados de demonstração como dados reais.

### Justificativa da prioridade por IA

Melhorar o retorno estruturado de prioridade e justificativa, validar a resposta e apresentar a explicação ao servidor. Manter a possibilidade de revisão humana e tratar falhas sem impedir o acompanhamento do protocolo.

Achado inicial: o classificador solicitava prioridade e motivo, mas limitava a resposta a `max_tokens: 10`, o que podia truncar a justificativa. Em 10/10/2026, foi implementado contrato JSON validado, limite de 256 tokens, consulta do motivo pela API e exibição no detalhe. A nova função ainda não foi publicada nem comprovada por chamada real ao modelo.

Dados previstos para a classificação: categoria e descrição do chamado. Documentar dependência do provedor, custo e possibilidade de erro de interpretação. Revisar os dados enviados para não incluir informações pessoais desnecessárias.

### Eficiência do agrupamento

No cálculo de metadados de cada grupo, substituir a ordenação usada apenas para escolher o protocolo mais antigo por uma busca do menor elemento. Preservar o desempate pelo identificador e as regras de contagem e alerta.

Para um grupo com `m` membros, o trecho passa de ordenação O(m log m) para busca O(m). Isso se refere ao cálculo dos metadados; não implica que todas as consultas ou ordenações do sistema terão essa complexidade.

## Referências internas

- `entrega-fase-5/backlog-fase-5.md`: backlog anterior, usado como referência histórica.
- `src/pages/AdminDashboard.tsx`: painel administrativo.
- `src/pages/AdminRecurringAlerts.tsx`: tela de recorrência.
- `backend-java/src/main/java/br/com/fiap/hackgov/infrastructure/persistence/repository/JpaProtocolRepository.java`: consultas e projeções existentes.
- `backend-java/src/main/java/br/com/fiap/hackgov/application/service/ProtocolLocationGroupService.java`: agrupamento e metadados.
- `supabase/functions/classify-priority/openrouter-client.ts`: chamada ao modelo e leitura da classificação.

## Entrega final exigida

- Documento com as quatro partes, em PDF.
- Apresentação com até 10 slides, em PDF; slide inicial com nomes completos, RMs e fotos.
- Vídeo de até 5 minutos com pitch e navegação real, publicado no YouTube como não listado.
- Link do vídeo no documento e na apresentação do website, conforme o enunciado.
- Código, wireframes e recursos necessários para execução.
- ZIP com uma pasta organizada e instruções de execução, conferido após descompactar.
- Cadastro correto dos integrantes e RMs na FIAP ON, com uma única entrega pelo grupo.

## Como manter o contexto

Após cada incremento:

1. Atualizar o estado da história em `backlog-etapa.md`.
2. Acrescentar em `historico-evolucoes.md` o problema, a mudança, os arquivos, a verificação, o resultado e as pendências.
3. Atualizar este contexto quando houver uma decisão de escopo ou arquitetura.
4. Registrar evidências suficientes para reproduzir as consultas e demonstrar as funcionalidades.

Não registrar senhas, tokens, chaves de API ou dados pessoais reais nos documentos.

## Estado após o primeiro incremento funcional — 10/10/2026

- `main` atualizada por pull; já estava na revisão mais recente `5e933f3`. Arquivos locais preservados.
- Indicadores, distribuição, evolução mensal e ranking implementados com SQL parametrizado e exibidos no Dashboard Executivo.
- Seleção do protocolo principal alterada para busca do mínimo com desempate por ID, preservando as regras existentes.
- IA com saída estruturada, justificativa, tratamento de erro e reprocessamento na interface; validação real da nova classificação remota permanece pendente.
- Consultas executadas sobre a base de demonstração existente e sobre uma fixture temporária isolada no PostgreSQL.
- 111 testes Java, 118 testes frontend e 3 testes Deno aprovados; compilação TypeScript e build verificados.
- Fluxo dos indicadores validado no navegador, incluindo alteração de período e ausência de dados. HTTP de autorização também conferido.

Arquivos complementares: `analise-sql-e-eficiencia.md`, `validacao-etapa.md`, `evidencias/resultados-sql.json` e `sql/consultas-demonstracao.sql`.
