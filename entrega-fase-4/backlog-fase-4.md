# Product Backlog - Fase 4

## Visao geral

O backlog do Cidadao Informa foi revisado para refletir a evolucao do projeto na Fase 4. As novas user stories priorizam a experiencia em React, integracao com APIs, seguranca da informacao, manipulacao de arquivos e auditoria blockchain para eventos criticos.

## Backlog atualizado

| ID | Tema | User story | Prioridade | Status |
| --- | --- | --- | --- | --- |
| US01 | Front-end cidadao | Como cidadao, quero criar uma solicitacao informando categoria, endereco e descricao, para registrar problemas urbanos de acessibilidade. | Alta | Implementada |
| US02 | Front-end cidadao | Como cidadao, quero acompanhar meus protocolos em uma tela propria, para verificar o andamento das minhas solicitacoes. | Alta | Implementada |
| US03 | Front-end cidadao | Como cidadao, quero consultar o detalhe de um protocolo, para visualizar status, descricao, localizacao e andamento. | Alta | Implementada |
| US04 | Front-end admin | Como servidor publico, quero visualizar uma fila com todas as solicitacoes, para fazer triagem e acompanhamento operacional. | Alta | Implementada |
| US05 | Front-end admin | Como servidor publico, quero alterar status e prioridade de um protocolo, para atualizar o atendimento conforme a analise tecnica. | Alta | Implementada |
| US06 | Integracao/API | Como usuario do sistema, quero que as telas consumam APIs reais ou simuladas com contrato previsivel, para garantir integracao entre interface e dados. | Alta | Implementada |
| US07 | Estados de integracao | Como usuario, quero ver estados de carregamento, sucesso e falha, para entender se uma operacao foi processada corretamente. | Alta | Implementada |
| US08 | Seguranca | Como usuario autenticado, quero acessar apenas as funcionalidades permitidas ao meu perfil, para proteger dados administrativos e pessoais. | Alta | Implementada |
| US09 | Seguranca | Como sistema, quero emitir tokens assinados e com expiracao, para reduzir risco de adulteracao de sessao. | Alta | Implementada |
| US10 | Arquivos/relatorios | Como servidor publico, quero exportar relatorios em XLSX, para analisar dados e apoiar prestacao de contas. | Media | Implementada |
| US11 | Blockchain/auditoria | Como servidor publico, quero consultar uma trilha blockchain de auditoria do protocolo, para verificar a integridade de alteracoes criticas. | Media | Implementada |
| US12 | IA/priorizacao | Como servidor publico, quero que a IA sugira prioridade para solicitacoes, para apoiar a triagem dos atendimentos. | Media | Implementada |
| US13 | Acessibilidade | Como usuario, quero acessar recursos de contraste, tema e atalhos, para utilizar o sistema com mais conforto e inclusao. | Media | Implementada |
| US14 | Evidencias/anexos | Como cidadao, quero anexar imagens a uma solicitacao, para complementar a descricao do problema urbano. | Media | Parcial |

## Criterios de aceitacao das user stories prioritarias

### US01 - Criar solicitacao

- O formulario deve exigir categoria, endereco e descricao do problema.
- O sistema deve impedir o envio quando campos obrigatorios estiverem vazios.
- Ao enviar, deve exibir estado de carregamento.
- Em caso de sucesso, deve exibir mensagem positiva e redirecionar para "Meus Protocolos".
- Em caso de erro, deve exibir mensagem clara sem travar a tela.
- A solicitacao criada deve ser persistida via API.

### US02 - Acompanhar meus protocolos

- O cidadao autenticado deve visualizar apenas protocolos vinculados ao seu usuario.
- A listagem deve exibir servico/categoria, endereco, numero do protocolo, data e status.
- A tela deve apresentar estado de carregamento durante a busca.
- Caso nao existam protocolos, deve exibir mensagem de lista vazia.
- Caso a API falhe, deve exibir mensagem de erro em vez de apenas mostrar zero registros.

### US03 - Consultar detalhe do protocolo

- A tela deve carregar os dados do protocolo selecionado.
- O detalhe deve mostrar status, data de abertura, endereco, descricao e andamento.
- Se o protocolo nao existir ou nao puder ser carregado, deve exibir mensagem de protocolo nao encontrado.
- Para usuarios cidadaos, a tela deve evitar informacoes tecnicas administrativas.
- Para usuarios admin, a tela pode exibir controles de gestao e auditoria.

### US04 - Visualizar fila administrativa

- Apenas usuarios com perfil admin devem acessar a fila de solicitacoes.
- A fila deve listar solicitante, categoria, data, status, prioridade e acoes.
- A tela deve permitir filtro por status e categoria.
- A tela deve permitir busca por protocolo, solicitante ou endereco.
- O cidadao nao deve conseguir acessar rotas administrativas.

### US05 - Alterar status e prioridade

- Apenas admin deve conseguir alterar status de protocolo.
- Ao alterar o status, o sistema deve persistir a mudanca via API.
- Cada alteracao de status deve gerar um bloco de auditoria `STATUS_CHANGED`.
- Apenas admin deve conseguir alterar prioridade manualmente.
- Cada alteracao manual de prioridade deve gerar um bloco de auditoria `PRIORITY_CHANGED`.
- Em caso de falha na API, a interface deve exibir erro e manter a tela utilizavel.

### US06 - Consumir APIs

- O frontend deve centralizar chamadas de API em modulo proprio.
- As telas nao devem acessar diretamente detalhes internos das Edge Functions.
- As respostas devem seguir um contrato previsivel com `success`, `data` e `error`.
- Erros retornados pela API devem ser tratados pela interface.
- Operacoes autenticadas devem enviar token de sessao.

### US07 - Tratar estados de integracao

- O envio de solicitacao deve apresentar estado "enviando".
- A conclusao deve apresentar estado de sucesso.
- Falhas devem apresentar mensagem de erro visivel.
- Listagens devem diferenciar carregando, vazio e erro.
- Botoes de acao devem ser desabilitados durante operacoes em andamento quando necessario.

### US08 - Controle de acesso por perfil

- O sistema deve diferenciar usuarios `citizen` e `admin`.
- Rotas administrativas devem redirecionar usuarios sem permissao.
- O frontend nao deve permitir troca manual de perfil.
- A permissao deve vir da sessao validada pela API.
- A API deve bloquear escopos administrativos para usuarios nao admin.

### US09 - Sessao segura

- O login deve validar CPF e senha.
- A senha deve ser armazenada como hash, nunca em texto puro.
- O token de sessao deve ser assinado.
- O token deve possuir expiracao.
- Tokens invalidos ou expirados devem encerrar a sessao local.

### US10 - Exportar relatorios

- O admin deve conseguir exportar dados administrativos em XLSX.
- O arquivo exportado deve conter dados relevantes para analise.
- A acao de exportacao deve estar disponivel em telas administrativas.
- O botao deve ser desabilitado quando nao houver dados carregados.

### US11 - Consultar auditoria blockchain

- A aba "Blockchain" deve estar disponivel apenas para admin.
- A aba deve listar blocos associados ao protocolo.
- A listagem deve ser paginada.
- Cada bloco deve exibir evento, ator, hashes e data.
- O sistema deve indicar se a integridade da trilha esta verificada.
- Dados pessoais nao devem ser exibidos em texto aberto na trilha blockchain.

### US12 - Classificar prioridade com IA

- Ao criar protocolo, o sistema deve disparar classificacao de prioridade.
- O resultado deve atualizar `ai_priority` e `ai_status`.
- Falhas de IA devem ser registradas sem impedir a criacao do protocolo.
- A classificacao bem-sucedida deve gerar evento de auditoria `AI_PRIORITY_CLASSIFIED`.

## Historias futuras ou melhorias pendentes

| ID | User story | Motivo |
| --- | --- | --- |
| US15 | Como cidadao, quero que imagens anexadas sejam enviadas e salvas em storage, para manter evidencias visuais do problema. | O prototipo ja possui selecao/preview de imagens, mas o envio persistente pode ser evoluido. |
| US16 | Como admin, quero visualizar historico completo de alteracoes em uma tela global, para auditar todos os protocolos em um unico painel. | Hoje a auditoria aparece no detalhe de cada protocolo. |
| US17 | Como equipe tecnica, quero testes automatizados para fluxos criticos, para reduzir risco de regressao na autenticacao, protocolo e auditoria. | A validacao atual foi feita por build, type check e testes manuais. |
| US18 | Como admin, quero filtros avancados na aba Blockchain, para localizar blocos por evento, data ou validade. | A primeira versao possui paginacao e ordenacao, mas nao filtros avancados. |

## Observacao

As historias marcadas como implementadas foram contempladas no prototipo atual. As historias futuras indicam melhorias que podem ser priorizadas em fases seguintes, sem impedir a entrega da Fase 4.
