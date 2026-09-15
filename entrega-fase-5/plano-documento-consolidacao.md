# Plano do documento de consolidação técnica — Cidadão Informa

## 1. Objetivo do documento

Demonstrar que o Cidadão Informa evoluiu de um protótipo integrado para uma solução GovTech mais completa, com arquitetura em camadas, API Java REST, integração real com React e PostgreSQL, gestão regional de solicitações, relatórios, mecanismos de segurança, governança e rastreabilidade.

A narrativa central deve ser:

> O sistema não apenas registra solicitações urbanas; ele organiza o atendimento público, delimita o acesso de cada perfil, transforma registros operacionais em indicadores e preserva evidências das principais decisões realizadas sobre os protocolos.

O corte temporal recomendado é 11/06/2026, data do resumo da Fase 4. A comparação deve usar como ponto de partida o arquivo `entrega-fase-4/resumo-evolucao-projeto.md` e mostrar somente evoluções posteriores comprovadas pelo repositório.

## 2. Diagnóstico do estado atual em relação ao enunciado

| Parte exigida | Situação atual | Direção para o documento |
| --- | --- | --- |
| Versão atual do projeto | Forte | Comparar a Fase 4 com a arquitetura e as funções atuais, destacando impacto público e não apenas quantidade de telas. |
| Backlog atualizado | Concluído | O backlog definitivo e os critérios prioritários estão em `entrega-fase-5/backlog-fase-5.md`. |
| API RESTful e integração | Forte, com CRUD principal completo | O protocolo possui criação, leitura, atualização e exclusão lógica exclusiva do cidadão proprietário, integrada à interface. |
| Estruturas e estatística | Forte | Há listas, conjuntos, mapas, fila persistente de jobs e pilha LIFO de filtros. A transparência calcula média, mediana, P90, desvio-padrão e cobertura. |
| Governança e auditoria | Forte | Há perfis, escopo por prefeitura/UF/tela, JWT, rate limiting, CORS, RLS, cadeia de hashes e trilha administrativa de consultas sensíveis e exportações. |
| Entregáveis finais | A produzir | Documento em Word/PDF, apresentação com até 10 slides e PDF, roteiro/vídeo de até 5 minutos, link do vídeo e ZIP validado. |

## 3. Estrutura recomendada do documento final

### Elementos iniciais

1. Capa com nome do projeto, disciplina, turma, integrantes, RM e data.
2. Identificação dos integrantes com foto.
3. Sumário automático.
4. Resumo executivo de até uma página.
5. Link clicável do repositório e, quando disponível, link do vídeo não listado no YouTube.

### Introdução

Explicar brevemente o problema público: dificuldade de registrar, localizar, priorizar e acompanhar ocorrências de zeladoria e acessibilidade urbana. Apresentar os atores principais — cidadão, servidor, gestor do estabelecimento/prefeitura e gestor da plataforma — e o valor público esperado: transparência, melhor triagem, rastreabilidade e apoio à decisão.

Não repetir toda a história do projeto. A introdução deve preparar a comparação entre a entrega anterior e a versão atual.

## 4. Parte 1 — Versão atual e evolução do projeto

### Forma de apresentação

Abrir a seção com uma tabela “antes x agora x impacto”. Depois, desenvolver cada evolução em um ou dois parágrafos e acrescentar evidência visual ou técnica.

| Eixo | Fase 4 | Versão atual | Impacto a destacar |
| --- | --- | --- | --- |
| Arquitetura | React consumindo principalmente Edge Functions | React → API Java/Spring Boot → PostgreSQL; Edge Functions ficam atrás do back-end para IA | Centralização de regras, segurança e contratos de API |
| Back-end | Funções pontuais de autenticação e protocolos | API Java 21 em camadas, controllers, casos de uso, repositórios, DTOs, Spring Security e OpenAPI | Manutenibilidade, testes e separação de responsabilidades |
| Banco | Estrutura inicial de usuários, protocolos e auditoria | Migrations para coordenadas, imagens, custos, relatórios, permissões, estabelecimentos, assinaturas, campanhas e consumo de IA | Persistência compatível com operação municipal e evolução controlada do schema |
| Front-end cidadão | Cadastro, login, abertura e acompanhamento | Jornada simplificada, mapas aprimorados, anexos persistidos, protocolo público, transparência e assistente cidadão | Mais autonomia, clareza e acessibilidade |
| Gestão pública | Fila, dashboard, mapa e relatório básico | Escopo regional, cidadãos, permissões, alertas recorrentes, relatórios diários, custos e mapas de calor | Priorização territorial e acompanhamento operacional |
| Atualização de dados | Requisições assíncronas tradicionais | Eventos SSE para novas solicitações no mapa administrativo | Visibilidade operacional quase em tempo real |
| Arquivos | Exportação XLSX e anexos parciais | Fotos JPG/PNG validadas e persistidas; relatórios em PDF, XLSX e CSV seguro | Evidência visual e prestação de contas |
| Segurança | JWT, perfis cidadão/admin e rotas protegidas | JWT reconferido no servidor, limite de login, CORS restritivo, escopos por estabelecimento/UF/tela, RLS e segredos apenas no servidor | Princípio do menor privilégio e menor exposição de credenciais |
| Auditoria | Cadeia inicial de eventos do protocolo | Criação, status, custo, prioridade, classificação por IA e correção de imagem registrados em cadeia de hashes verificável | Detecção de adulteração e responsabilização |
| Inteligência e relatórios | Priorização por IA e relatórios básicos | Priorização, correção visual, chatbot com RAG, limites/custos, transparência pública e fechamento operacional diário | Apoio à triagem, comunicação e gestão baseada em dados |
| Qualidade | Build, lint e testes manuais | Vitest no front-end, JUnit/Mockito no back-end e checklist de integração | Menor risco de regressão |
| Implantação | Execução local/protótipo | Vercel para front-end e serviço Java, configuração por ambiente e health check | Solução demonstrável de ponta a ponta |

### Evidências sugeridas

- Diagrama da arquitetura atual baseado no `README.md`.
- Captura do Swagger local.
- Capturas da nova solicitação com fotos, fila administrativa, mapa de calor, transparência, relatório diário e permissões.
- Pequeno quadro com as migrations mais importantes, sem listar todas individualmente.
- Resultado dos comandos `npm test`, `npm run lint`, `npm run build` e `mvn test` próximo da data da entrega.

### Cuidados de redação

- Apresentar o mecanismo como “cadeia de auditoria encadeada por hashes”: cada registro guarda seu próprio hash e o hash do registro anterior, permitindo detectar alterações na sequência.
- Separar funcionalidades plenamente implementadas das parciais ou planejadas.
- Não usar métricas inventadas. Resultados quantitativos devem vir da API, do banco ou da base de demonstração identificada como tal.
- Informação do README atualizada para refletir as migrations até a V33.

## 5. Parte 2 — Ajustes no Product Backlog

### Estratégia

Manter as US01–US14 para conservar a rastreabilidade da Fase 4, atualizar seus estados e acrescentar as histórias abaixo. Usar as colunas: ID, épico, história, prioridade, status, dependências e evidência.

### Novas histórias propostas

| ID | Tema | User story | Prioridade | Estado observado |
| --- | --- | --- | --- | --- |
| US15 | Arquivos | Como cidadão, quero anexar até quatro fotos JPG ou PNG à solicitação, para comprovar o problema urbano. | Alta | Implementada |
| US16 | Front-end/transparência | Como visitante, quero consultar indicadores e um protocolo público sem visualizar dados pessoais ou evidências identificáveis, para acompanhar a atuação pública. | Alta | Parcial; o DTO público ainda devolve endereço, coordenadas e fotos |
| US17 | Segurança | Como gestor, quero limitar servidores por estabelecimento, UF e tela, para aplicar o menor privilégio. | Alta | Implementada |
| US18 | Front-end/operação | Como servidor, quero receber novas solicitações e identificar ocorrências recorrentes no território, para reagir mais rapidamente. | Alta | Implementada |
| US19 | Arquivos/relatórios | Como gestor, quero exportar fechamentos em PDF e planilha, para analisar e prestar contas. | Alta | Implementada |
| US20 | Segurança/auditoria | Como encarregado de governança, quero registrar consultas a cadastros sensíveis e exportações, para saber quem acessou ou extraiu dados pessoais. | Alta | Implementada |
| US21 | CRUD/auditoria | Como cidadão, quero excluir logicamente um protocolo criado por mim, para retirá-lo das consultas e da minha área sem permitir que terceiros apaguem meus registros. | Alta | Implementada |
| US22 | Arquivos/segurança | Como titular dos dados, quero que anexos sejam armazenados de forma privada e entregues por acesso temporário, para reduzir exposição indevida. | Alta | Parcial |
| US23 | API | Como integrador, quero respostas de erro padronizadas e documentação OpenAPI completa, para tratar falhas de modo previsível. | Alta | Parcial |
| US24 | Estatística | Como gestor, quero visualizar tendência, mediana, dispersão, SLA e recorrência, para priorizar ações com base em evidências. | Média | Implementada |
| US25 | Estruturas/front-end | Como servidor, quero desfazer alterações de filtros do painel, para recuperar rapidamente a visão anterior. | Baixa | Implementada com pilha LIFO limitada a 20 snapshots |
| US26 | Auditoria | Como auditor, quero verificar a integridade da cadeia e localizar eventos por protocolo, ator, ação e período, para investigar mudanças críticas. | Média | Parcial |

### Critérios de aceitação prioritários

#### US15 — Anexar fotos

- Deve aceitar somente JPG e PNG.
- Deve permitir no máximo quatro imagens.
- Deve compactar a imagem antes do envio quando necessário.
- Deve validar formato e limite também no back-end.
- Deve persistir as referências das imagens junto ao protocolo.
- Deve informar erro sem perder os demais campos preenchidos.

#### US16 — Transparência pública

- Deve permitir acesso sem autenticação somente a dados definidos como públicos.
- Deve ocultar nome, CPF, e-mail, telefone e endereço residencial do cidadão.
- Deve separar o endereço residencial, que permanece privado, do endereço da ocorrência, necessário para localizar o problema.
- O mapa estatístico deve trabalhar com agrupamentos geográficos, sem impedir que o detalhe público preserve a localização da ocorrência definida pelo produto.
- Não deve devolver fotos originais sem consentimento e moderação; quando necessário, deve usar uma versão pública tratada.
- Deve apresentar indicadores calculados a partir dos protocolos persistidos.
- Deve informar data/hora de geração e cobertura dos dados.
- Deve exibir a localização da ocorrência na consulta pública sem incluir dados pessoais ou administrativos do cidadão.

#### US17 — Controle de acesso delegado

- Deve distinguir cidadão, servidor, dono do estabelecimento e dono da plataforma.
- Deve validar a permissão no back-end, independentemente do que o front-end exiba.
- Deve restringir o servidor às UFs, ao estabelecimento e às telas atribuídas.
- Um gestor não deve delegar escopo maior do que o próprio.
- Tentativas sem autenticação devem retornar `401`; tentativas autenticadas sem permissão devem retornar `403`.

#### US19 — Exportação de relatórios

- Deve bloquear ou avisar a exportação quando não houver dados.
- Deve gerar PDF e/ou planilha com título, período, indicadores e fonte dos dados.
- Deve preservar caracteres em português e formatos de data e moeda.
- Células iniciadas por caracteres de fórmula devem ser neutralizadas nas exportações CSV.
- A exportação com dados pessoais deve exigir permissão e gerar evento de auditoria.

#### US20 — Auditoria de consulta e exportação

- Deve registrar usuário, papel, ação, data/hora, recurso, finalidade/justificativa quando aplicável e resultado da operação.
- Não deve gravar CPF, telefone ou conteúdo sensível em texto aberto no evento.
- Deve registrar consultas ao detalhe de cidadão, exportações administrativas e consultas globais sensíveis.
- Somente perfis autorizados devem consultar a trilha.
- Os registros devem ser pesquisáveis por ator, ação e período.

#### US21 — Exclusão lógica auditada

- Deve disponibilizar `DELETE /api/protocols/{id}` somente ao cidadão autenticado que criou o protocolo.
- Um servidor, dono de estabelecimento ou outro cidadão não deve conseguir iniciar a exclusão.
- A interface deve pedir confirmação clara antes de executar a ação.
- Deve marcar o registro como excluído, sem apagá-lo fisicamente.
- A área do cidadão, a consulta pública e as listagens operacionais normais não devem retornar registros excluídos.
- A trilha deve registrar `PROTOCOL_LOGICALLY_DELETED` com ator, papel e data/hora, sem copiar a descrição ou as fotos.
- O endpoint deve retornar `204` no sucesso, `404` quando o protocolo não existir e `403` quando o usuário não for o proprietário.
- A regra deve definir até qual etapa a exclusão pode ocorrer; recomendação: permitir enquanto o protocolo estiver aberto e oferecer solicitação de anonimização/retirada pública depois que o atendimento tiver começado.
- O CORS deve passar a aceitar o método `DELETE`.

#### US22 — Proteção dos anexos

- Deve validar tipo real, tamanho, quantidade e extensão no cliente e no servidor.
- Deve rejeitar referências externas fora do storage permitido.
- Deve armazenar anexos em bucket privado ou justificar formalmente qualquer objeto público.
- Deve entregar anexos privados por URL assinada e expirada.
- Deve remover metadados desnecessários da imagem quando possível.
- Deve impedir que a API pública devolva a imagem original quando ela puder identificar pessoa, residência ou placa.

#### US23 — Contrato de erro da API

- Todos os erros devem seguir um DTO comum com código, mensagem, timestamp, rota e identificador de correlação.
- Validações devem retornar `400` ou `422`; autenticação `401`; autorização `403`; ausência `404`; conflito `409`; limite `429`; falha de dependência `502` ou `503`.
- Erros internos não devem expor stack trace, SQL, segredo ou detalhe de infraestrutura.
- O Swagger deve documentar exemplos de sucesso e erro dos endpoints prioritários.

## 6. Parte 3 — API RESTful e integração completa

### Conteúdo da seção

1. Apresentar o diagrama: React → API Java → PostgreSQL; API Java → Edge Functions de IA.
2. Explicar que o navegador não recebe credenciais do Supabase e centraliza as chamadas em `src/services/http.ts`, `src/services/api.ts` e serviços especializados.
3. Descrever autenticação stateless com Bearer JWT e autorização novamente validada no servidor.
4. Organizar os endpoints por recurso, não apenas colar todo o Swagger.
5. Incluir um fluxo completo demonstrado: login → criação do protocolo → persistência → classificação → atualização no painel → alteração de status → auditoria/relatório.

### Grupos de endpoints a documentar

| Recurso | Operações relevantes |
| --- | --- |
| Autenticação | `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`, `PATCH /api/auth/me/phone` |
| Protocolos | `POST /api/protocols`, `GET /api/protocols`, `GET /api/protocols/{id}`, `GET /api/protocols/public/{id}`, `PATCH /api/protocols/{id}/status`, `DELETE /api/protocols/{id}` |
| Tempo real e auditoria | `GET /api/protocols/events`, `GET /api/protocols/{id}/audit`, `GET /api/protocols/audit/verify` |
| Auditoria administrativa | `POST /api/admin/audit/exports`, `GET /api/admin/audit/events` com filtros e paginação |
| IA | consulta/regeneração/prioridade manual, correção de imagem, chatbot, prompts e logs |
| Gestão | cidadãos, permissões de servidores, relatórios e alertas recorrentes |
| Transparência | `GET /api/transparency` e `GET /api/protocols/stats` |
| Plataforma | onboarding de prefeituras, visão global, assinatura, carteira e consumo de IA |

### Matriz CRUD que deve aparecer

| Recurso principal | Create | Read | Update | Delete | Conclusão atual |
| --- | --- | --- | --- | --- | --- |
| Protocolos | Sim | Sim | Sim, por status/prioridade/custo | Sim, lógico e pelo cidadão proprietário | CRUD principal completo e auditado |
| Usuário/cidadão | Cadastro | Perfil e consultas administrativas | Telefone e permissões | Não | CRUD parcial; exclusão pode depender de política LGPD/retenção |
| Permissões | Criação do servidor/permissões | Listagem/perfil | Substituição de escopos | Substituição remove vínculos antigos | CRUD funcional no domínio de associação, mas não equivale a excluir usuário |
| Relatórios | Geração agendada | Lista e detalhe | Não aplicável ao fechamento imutável | Não aplicável/retido | Explicar que nem todo recurso de domínio deve aceitar todas as operações |

O `DELETE` lógico foi implementado para o cidadão proprietário, com `deleted_at`, `deleted_by`, autorização por propriedade, exclusão das consultas normais, auditoria, testes e integração no front-end. O servidor público não recebe permissão para apagar protocolos de cidadãos.

### Boas práticas a evidenciar

- Substantivos nas rotas e métodos HTTP coerentes.
- `200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`, `429`, `502` e `503` conforme o caso.
- DTOs de entrada/saída, validação e mensagens sem detalhes internos.
- Filtros de acesso por usuário, estabelecimento, UF e tela.
- Paginação nos recursos que podem crescer; se ainda não existir em listagens principais, registrar como melhoria.
- OpenAPI/Swagger no ambiente apropriado.
- Testes de controller, serviço, autenticação, escopo e falhas.

### Evidências mínimas

- Quadro de endpoints com método, rota, perfil, entrada, retorno e status codes.
- Uma requisição e resposta de sucesso.
- Exemplos de `401`, `403`, `404`, `429` e validação.
- Captura do DevTools mostrando a interface React consumindo `/api/*`.
- Captura do Swagger ou exportação da especificação OpenAPI.

## 7. Parte 4 — Estruturas de dados e relatórios estatísticos

### Estruturas já presentes

| Estrutura | Uso real | Motivo |
| --- | --- | --- |
| Lista (`List`/arrays) | Protocolos, imagens, blocos de auditoria, transições e itens dos relatórios | Mantém coleções ordenadas para exibição e processamento sequencial |
| Conjunto (`Set`) | UFs e permissões únicas, IDs de protocolos e papéis administrativos | Evita duplicidade e permite teste de pertencimento eficiente |
| Mapa (`Map`) | Evidências da auditoria, agregações estatísticas, assinantes SSE e cache | Associa chaves a valores e simplifica agrupamentos/consultas |
| Fila persistente | `ai_priority_jobs` com estados `pending`/`failed`, reprocessada por `createdAt ASC`, no máximo três tentativas | Preserva trabalho assíncrono e retoma primeiro os jobs mais antigos |
| Pilha LIFO | Histórico dos filtros da fila administrativa, implementado com `BoundedStack`, `push` e `pop` | Permite desfazer a última alteração e limita o histórico a 20 snapshots |

### Complemento sugerido para a pilha

LIFO significa *Last In, First Out*: o último item colocado é o primeiro retirado. É o mesmo comportamento de uma pilha de pratos. Se os filtros aplicados forem `Estado SP`, depois `Status atrasado` e depois `Categoria visual`, a primeira ação de “desfazer” remove `Categoria visual`; a próxima remove `Status atrasado`.

O front-end administrativo implementa uma pilha de snapshots de filtros por meio de `BoundedStack`, usando `push` e `pop` na ação “Desfazer filtro”. Antes de cada mudança, o estado atual entra na pilha; ao desfazer, o último estado é retirado e reaplicado. O histórico fica limitado aos 20 últimos estados, existe apenas durante a permanência na tela e não persiste dados pessoais. Testes unitários comprovam o comportamento LIFO, o limite e a limpeza da estrutura.

### Análise estatística recomendada

Definir primeiro o universo, o período e se os dados são reais, anonimizados ou de demonstração. Em seguida, calcular e interpretar:

- frequência absoluta e relativa por status, categoria, prioridade, cidade/UF e região;
- taxa de conclusão: `concluídos / total × 100`;
- taxa de cumprimento de SLA: `ativos dentro do prazo / ativos × 100`;
- cobertura de dados: protocolos com coordenadas, custo e classificação de IA;
- média, mediana, mínimo, máximo, quartis e desvio-padrão do tempo de resolução;
- média, mediana, quartis e desvio-padrão do custo de resolução;
- moda das categorias e regiões;
- evolução mensal de registros e conclusões;
- taxa de falha e cobertura da classificação por IA;
- concentração e recorrência geográfica de solicitações.
- percentis P50 e P90 do tempo de resolução, para mostrar o comportamento típico e os casos mais demorados;
- idade do backlog aberto, separada em faixas de dias;
- relação entre entradas e conclusões por período, indicando se o estoque de solicitações cresce ou diminui;
- custo médio e mediano por protocolo concluído, categoria e região;
- participação acumulada das regiões/categorias em um gráfico de Pareto;
- concordância entre prioridade sugerida pela IA e prioridade definida pelo servidor;
- taxa de reabertura ou retrabalho, caso esse evento passe a ser modelado;
- demanda por mil habitantes somente se for utilizada uma fonte populacional confiável e citada.

### Gráficos e tabelas

1. Barras: quantidade e percentual por categoria/status.
2. Linha: registros e conclusões por mês.
3. Barras empilhadas: status por região ou categoria.
4. Boxplot ou tabela de cinco números: tempo e custo de resolução.
5. Mapa de calor: concentração territorial.
6. Tabela de SLA: no prazo, próximo do vencimento e atrasado.
7. Ranking de ocorrências recorrentes, com critério de agrupamento explicado.

### Forma de interpretar

Cada visual deve responder quatro perguntas:

1. O que foi medido?
2. Qual é o principal resultado?
3. Qual limitação existe na amostra?
4. Que decisão pública o resultado pode apoiar?

Sugestões de negócio, sempre condicionadas aos dados encontrados:

- reforçar equipes nas regiões de maior concentração;
- priorizar manutenção preventiva onde há recorrência;
- investigar categorias com maior mediana e dispersão de tempo;
- revisar SLA ou capacidade quando a taxa de atraso for persistente;
- revisar a triagem de IA quando houver falhas ou divergência elevada;
- melhorar a coleta quando a cobertura de coordenadas ou custos for baixa.

Evitar concluir causalidade apenas a partir de correlação ou frequência.

## 8. Parte 5 — Governança e auditoria

### Tabela de perfis a incluir

| Perfil | Escopo e permissões | Funcionalidades | Acesso a dados pessoais |
| --- | --- | --- | --- |
| Visitante | Somente conteúdo público | Landing, transparência, protocolo público, termos e privacidade | Não; deve receber dados anonimizados/minimizados |
| Cidadão | Própria conta e próprios protocolos | Criar solicitação, anexar fotos, acompanhar protocolo, mapa e perfil | Sim, apenas os próprios dados e evidências |
| Servidor (`admin`) | Prefeitura/estabelecimento e UFs delegadas; telas opcionais específicas | Dashboard, fila, mapa, alertas e, conforme permissão, cidadãos, usuários, relatórios e IA | Pode acessar dados dos cidadãos somente quando a função e a tela exigirem |
| Dono do estabelecimento (`establishment_owner`) | Estabelecimento associado | Gestão do assinante, visão administrativa e consumo/carteira de IA conforme regras | Dados administrativos e, se autorizado, dados operacionais do próprio estabelecimento |
| Dono da plataforma (`platform_owner`) | Visão global | Prefeituras, solicitações comerciais, assinaturas, pagamentos e visão global | Potencial acesso amplo; deve ser excepcional, justificado e auditado |
| Sistema/IA | Somente processos técnicos autorizados | Priorização, correção de imagem, geração de relatórios e eventos | Deve receber apenas os campos necessários para cada processamento |

### Operações que precisam de auditoria

| Operação | Situação | Evento sugerido |
| --- | --- | --- |
| Criação de protocolo | Já registrada | `PROTOCOL_CREATED` |
| Mudança de status | Já registrada | `STATUS_CHANGED` |
| Registro de custo de resolução | Já registrado | `RESOLUTION_COST_RECORDED` |
| Mudança manual de prioridade | Já registrada | `PRIORITY_CHANGED` |
| Classificação automática por IA | Já registrada pela função de classificação | `AI_PRIORITY_CLASSIFIED` |
| Correção de imagem por IA | Já registrada | `AI_CORRECTION_GENERATED` |
| Consulta da lista/detalhe de cidadão | Implementada | `SENSITIVE_CITIZEN_LIST_VIEWED` / `SENSITIVE_CITIZEN_VIEWED` |
| Exportação administrativa | Implementada | `DATA_EXPORTED` |
| Alteração de permissão/papel/UF | A implementar ou confirmar | `USER_ACCESS_CHANGED` |
| Exclusão lógica | Implementada | `PROTOCOL_LOGICALLY_DELETED` |
| Aprovação/rejeição de prefeitura e alteração financeira | A implementar ou confirmar | eventos próprios com ator e valores protegidos |

### Logs técnicos x registros de auditoria

Usar uma comparação curta:

| Logs técnicos | Registros de auditoria |
| --- | --- |
| Ajudam a diagnosticar disponibilidade, desempenho e erros | Demonstram quem fez o quê, quando e sobre qual recurso |
| Exemplos: timeout, falha da IA, exceção, latência, tentativa de retry | Exemplos: status alterado, dado sensível consultado, exportação, permissão modificada |
| Podem ter retenção menor e grande volume | Exigem retenção, integridade e acesso mais restrito |
| Não devem carregar segredo ou dado pessoal desnecessário | Devem minimizar dados e preservar evidência suficiente para responsabilização |
| Podem ser reprocessados/rotacionados | Não devem ser silenciosamente alterados ou apagados |

### Situação e próximos passos da auditoria

1. Implementado: serviços separados para a cadeia do protocolo e para consultas/exportações administrativas, preservando suas finalidades distintas.
2. Implementado parcialmente: eventos possuem ID, data/hora, ator, papel, ação, recurso, estabelecimento e resultado; identificador de correlação permanece como evolução.
3. Implementado: a trilha administrativa registra hashes, contagens e metadados mínimos, sem copiar CPF, telefone, descrição, imagem, token ou segredo.
4. Implementado: sucesso e tentativa negada são registrados nos fluxos sensíveis cobertos.
5. Implementado na API: pesquisa paginada por ator, ação e período; uma tela global de auditoria permanece como evolução de front-end.
6. Pendente: formalizar prazo de retenção e procedimento de exportação da própria auditoria.
7. Implementado: testes verificam gravação, hash, allowlist, autorização e pesquisa.

### Medidas de redução de exposição pela API

- JWT assinado, expirável e validado em cada requisição autenticada.
- Senhas armazenadas por hash.
- Rate limiting por IP e CPF no login.
- CORS com origens explícitas e sem wildcard em produção.
- Credenciais do banco e Supabase mantidas fora do bundle React.
- Front-end acessando o Supabase apenas por meio da API Java nas funções atuais.
- Autorização no back-end por papel, estabelecimento, UF e tela.
- DTO público separado, sem nome, CPF, e-mail, telefone ou endereço residencial. Endereço e coordenadas da ocorrência permanecem por regra do produto; fotos exigem política de moderação.
- RLS habilitada e privilégios de `anon`/`authenticated` revogados em tabelas sensíveis.
- Hash de descrições, endereços, solicitantes e justificativas na trilha, em vez de conteúdo aberto.
- Limites e allowlist de formatos/referências para imagens.
- Neutralização de fórmulas em CSV.
- Swagger desabilitado no perfil de produção quando necessário.
- Segredo próprio para cron e comunicação servidor-servidor com Edge Functions.

### Riscos residuais que devem ser assumidos, não escondidos

- As fotos originais ainda são devolvidas pela consulta pública do protocolo e precisam de política de consentimento/moderação. O local da ocorrência permanece público por decisão do produto; o endereço residencial continua separado e privado.
- Imagens grandes corrigidas por IA podem ser gravadas em storage público; recomenda-se bucket privado e URLs assinadas com expiração.
- O rate limiter de login é local ao processo e zera após reinicialização; uma solução distribuída seria mais robusta.
- A serialização `synchronized` da cadeia protege uma instância, mas múltiplas instâncias exigem coordenação/constraint transacional no banco.
- Consultas sensíveis e exportações já possuem trilha própria; permissões e ações financeiras ainda podem receber eventos administrativos específicos.
- Listagens grandes precisam de paginação server-side.
- A política de retenção, anonimização e atendimento aos direitos do titular deve ser formalizada.

## 9. Conclusão do documento

Retomar três resultados:

1. O cidadão consegue registrar e acompanhar uma demanda com evidências e transparência.
2. O poder público consegue organizar fila, território, prioridade, custo e indicadores.
3. A plataforma aplica controles de acesso e rastreabilidade, embora ainda existam melhorias de conformidade e escala identificadas de forma transparente.

Encerrar com próximos passos objetivos: proteção privada dos anexos, auditoria de permissões e ações financeiras, paginação, análise por categoria/região e testes ponta a ponta.

## 10. Plano da apresentação — até 10 slides

| Slide | Conteúdo | Evidência visual |
| --- | --- | --- |
| 1 | Projeto, integrantes, RM e fotos | Identidade do grupo |
| 2 | Problema público e proposta de valor | Fluxo cidadão → prefeitura |
| 3 | Evolução desde a Fase 4 | Antes x agora |
| 4 | Arquitetura e integração | Diagrama React/API Java/PostgreSQL/IA |
| 5 | Jornada do cidadão | Nova solicitação, fotos e acompanhamento |
| 6 | Operação do servidor | Fila, mapa, recorrência e status |
| 7 | Dados e estatística | Dois ou três gráficos com interpretação |
| 8 | Segurança e governança | Perfis, escopos e controles |
| 9 | Auditoria e relatórios | Cadeia de hashes + PDF/XLSX |
| 10 | Impacto, limitações, próximos passos, repositório e vídeo | CTA final/QR codes |

O PDF dos slides deve preservar links e legibilidade; evitar parágrafos longos.

## 11. Roteiro do vídeo — até 5 minutos

| Tempo | Conteúdo |
| --- | --- |
| 0:00–0:35 | Problema público, público-alvo e proposta de valor |
| 0:35–1:00 | Arquitetura e evolução desde a Fase 4 |
| 1:00–2:10 | Login do cidadão, abertura com localização/foto e acompanhamento |
| 2:10–3:25 | Login do servidor, fila, filtros, mapa/recorrência e alteração de status |
| 3:25–4:15 | Relatórios, estatística e exportação |
| 4:15–4:45 | Permissões, proteção de dados e auditoria |
| 4:45–5:00 | Impacto e encerramento |

Usar contas de demonstração, preparar dados previamente e ensaiar para não depender de geração demorada por IA durante a gravação.

## 12. Sequência de execução recomendada

1. Concluído: CRUD/exclusão lógica, pilha de filtros, estatística descritiva e auditoria de consulta/exportação.
2. Rodar todos os testes e registrar evidências.
3. Extrair um conjunto de dados identificado e reproduzível para os cálculos estatísticos.
4. Produzir tabelas, gráficos e interpretações.
5. Redigir o documento em Markdown/Word com as cinco partes.
6. Inserir capturas, legendas, fontes e links.
7. Criar a apresentação de até 10 slides a partir do documento já validado.
8. Gravar o vídeo, publicar como não listado e testar o link em janela anônima.
9. Gerar os dois PDFs e conferir visualmente todas as páginas.
10. Montar o ZIP final e testar a abertura em uma pasta limpa após descompactar.

## 13. Checklist do ZIP

- Documento final em PDF.
- Documento editável em DOCX, se desejado pelo grupo.
- Apresentação em PDF.
- Apresentação editável em PPTX.
- Código completo ou arquivo com link e instruções do repositório.
- Wireframes e recursos visuais utilizados.
- `LINK_VIDEO_YOUTUBE.txt` e o mesmo link no documento e nos slides.
- README com requisitos, variáveis sem segredos e instruções de execução.
- Evidências de teste ou anexo técnico.
- Nenhum `.env`, token, senha, chave ou dado pessoal real.
- Nomes e RMs conferidos no arquivo e no cadastro do grupo na FIAP ON.

## 14. Fontes internas para a redação

- `entrega-fase-4/resumo-evolucao-projeto.md`
- `entrega-fase-4/backlog-fase-4.md`
- `README.md`
- `src/App.tsx`
- `src/services/api.ts` e `src/services/http.ts`
- `src/pages/Transparency.tsx`
- `src/pages/AdminReports.tsx` e `src/pages/AdminReportDetails.tsx`
- `src/utils/exportUtils.ts` e `src/utils/dailyReportExports.ts`
- `backend-java/src/main/java/br/com/fiap/hackgov/api/controller/`
- `backend-java/src/main/java/br/com/fiap/hackgov/application/service/`
- `backend-java/src/main/java/br/com/fiap/hackgov/infrastructure/config/SecurityConfig.java`
- `backend-java/src/main/java/br/com/fiap/hackgov/application/service/ProtocolAuditService.java`
- `backend-java/src/main/java/br/com/fiap/hackgov/application/usecase/protocol/GetTransparencyUseCase.java`
- `backend-java/src/main/resources/db/migration/`
- `supabase/migrations/` e `supabase/functions/`
