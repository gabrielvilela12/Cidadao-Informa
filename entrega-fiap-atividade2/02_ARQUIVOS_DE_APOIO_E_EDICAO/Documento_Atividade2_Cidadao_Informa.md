# ATIVIDADE 2 - ENTERPRISE Challenge - EGESP

## Cidadao Informa: Ciencia de Dados e IA no Projeto HackGov

**Grupo:** Gabriel e Luis Gustavo  
**Data:** 25/05/2026  
**Link do video pitch:** https://youtu.be/INSERIR_LINK_DO_VIDEO_NAO_LISTADO

---

## 1. Contextualizacao do Projeto

O **Cidadao Informa** e uma plataforma HackGov voltada a transformacao digital da gestao publica municipal, com foco em zeladoria urbana e acessibilidade. O sistema permite que cidadaos registrem ocorrencias como calcadas quebradas, rampas bloqueadas, falhas de sinalizacao visual ou auditiva e outras barreiras urbanas. Do lado da administracao publica, a prefeitura acompanha a fila de solicitacoes, visualiza mapas, consulta dashboards e gera relatorios para apoiar a tomada de decisao.

A proposta de valor e transformar um fluxo que normalmente e manual, disperso e pouco transparente em uma jornada digital rastreavel. O cidadao passa a ter protocolo e acompanhamento de status; o servidor publico passa a ter uma visao consolidada das demandas, indicadores de atendimento e apoio de IA para priorizar os casos mais criticos.

### Evolucao do prototipo

Nesta etapa, o sistema ja apresenta:

- Tela inicial e fluxo de autenticacao.
- Cadastro e login de cidadaos.
- Registro de nova solicitacao em etapas.
- Classificacao por categorias de acessibilidade: fisica, visual, auditiva e outros.
- Formulario com endereco, descricao, evidencias por imagem e mapa interativo.
- Consulta de protocolos pelo cidadao.
- Tela publica de acompanhamento de protocolo.
- Dashboard administrativo com indicadores em tempo real.
- Fila de solicitacoes, mapa administrativo e relatorios.
- Exportacao de dados em planilhas.
- Backend Java/Spring Boot com autenticacao JWT, JPA, Flyway e banco PostgreSQL/Supabase.
- Modulo de IA finalizado para classificacao de prioridade dos protocolos.
- Tela de logs de IA para auditoria das classificacoes e alteracoes manuais.
- Praticas de seguranca como hash de senha, separacao de perfis, tokens e controle de rotas.

### Contribuicoes da 1a mentoria EGESP

A 1a mentoria com a EGESP, realizada em 05/05/2026, reforcou a necessidade de demonstrar valor publico de forma objetiva. Para o nosso projeto, isso orientou quatro decisoes principais:

- Dar mais destaque a indicadores de gestao, como volume de protocolos, taxa de resolucao, atrasos e distribuicao por categoria.
- Tratar IA como apoio a decisao, e nao como substituicao automatica do servidor publico.
- Valorizar dados confiaveis, rastreaveis e explicaveis, principalmente por se tratar de governo e servico publico.
- Considerar LGPD, seguranca e transparencia desde o MVP, evitando exposicao indevida de dados pessoais do cidadao.

Com isso, o projeto passou a enfatizar dashboards, relatorios, fila priorizada e um modulo de IA funcional para auxiliar a triagem administrativa.

---

## 2. Ciencia de Dados e Uso de IA

### Atualizacoes implementadas

O prototipo passou a usar os dados dos protocolos como base para analise gerencial. As principais atualizacoes relacionadas a Ciencia de Dados e IA sao:

- Consolidacao de indicadores no dashboard administrativo.
- Calculo de total de solicitacoes, chamados em analise, atrasos e taxa de resolucao.
- Distribuicao por status e por categoria.
- Tendencia mensal de solicitacoes abertas e resolvidas.
- Relatorios com exportacao em planilha para analise externa.
- Visualizacao geografica por mapa, permitindo observar concentracao territorial das demandas.
- Bloco de **Insights de IA e Ciencia de Dados** no dashboard administrativo.
- Classificacao de prioridade por IA em quatro niveis: baixa, media, alta e critica.
- Badges de prioridade na fila administrativa.
- Acao para **Regenerar IA** quando o servidor quiser reprocessar uma analise.
- Acao de **Trocar prioridade** manualmente, com justificativa.
- Pagina de **Logs IA**, registrando classificacoes feitas pela IA e alteracoes feitas pelo administrador.

### IA finalizada e funcionando

A IA de prioridade ja foi implementada no sistema. O fluxo funciona da seguinte forma:

1. O protocolo contem categoria e descricao do problema informado pelo cidadao.
2. A classificacao e processada por uma Supabase Edge Function chamada `classify-priority`.
3. A Edge Function envia a categoria e a descricao para o OpenRouter usando o modelo Gemini 2.5 Flash.
4. O modelo retorna uma prioridade: baixa, media, alta ou critica.
5. O sistema grava o resultado no protocolo, usando os campos `ai_priority` e `ai_status`.
6. A fila administrativa mostra a prioridade por meio de badges visuais.
7. O servidor pode regenerar a classificacao ou alterar a prioridade manualmente.
8. Toda classificacao e toda alteracao manual sao registradas em logs de auditoria.

Esse fluxo mostra que a IA nao esta apenas planejada: ela ja esta integrada ao produto, aparece na interface administrativa e gera rastreabilidade para a tomada de decisao.

### Como a IA contribui para a proposta de valor

A IA contribui para reduzir o tempo de triagem e dar mais clareza sobre quais chamados precisam de atencao primeiro. Em vez de trabalhar apenas por ordem de chegada, a equipe administrativa passa a enxergar sinais de urgencia e impacto social.

Isso e especialmente importante em acessibilidade. Uma rampa bloqueada, uma calcada danificada ou uma sinalizacao ausente pode afetar diretamente pessoas com deficiencia, idosos, criancas e outros grupos vulneraveis.

Mesmo com IA, a decisao final continua humana. O servidor visualiza a sugestao, pode pedir nova analise, pode alterar a prioridade e deve justificar a mudanca. Assim, o sistema combina agilidade, controle humano, transparencia e responsabilidade.

### Planejamento a partir daqui

Como a IA de prioridade ja esta funcionando, as proximas evolucoes previstas sao:

- Enriquecer a base de dados com bairro, latitude, longitude, secretaria responsavel, prazo de SLA e historico de alteracoes.
- Criar analise por regiao para identificar bairros com maior recorrencia.
- Evoluir filtros por status, categoria, bairro e prioridade.
- Usar IA generativa para resumir protocolos longos e sugerir encaminhamentos.
- Avaliar imagens anexadas para identificar tipo de ocorrencia e qualidade da evidencia.
- Criar previsao de risco de atraso com base no historico.
- Gerar relatorios executivos automaticos para gestores.
- Preparar dados anonimizados para transparencia publica.

### Mudancas em relacao ao planejado

Inicialmente, o projeto tratava a zeladoria urbana de forma mais ampla. Nesta fase, o foco foi refinado para acessibilidade urbana, pois esse recorte torna o problema mais claro, mensuravel e alinhado a impacto social.

Tambem houve evolucao importante na estrategia de IA. O projeto comecou com indicadores explicaveis e score de prioridade no dashboard, mas avancou para uma classificacao generativa real usando Supabase Edge Function, OpenRouter e Gemini 2.5 Flash. Dessa forma, a IA passou a ser uma funcionalidade operacional, auditavel e integrada a interface do servidor.

---

## 3. Materiais e Metodos para Ciencia de Dados e IA

### Tecnologias utilizadas

| Camada | Tecnologias e ferramentas | Uso no projeto |
|---|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, React Router | Interface do cidadao e do servidor publico |
| Visualizacao de dados | Recharts | Dashboards, graficos e relatorios |
| Mapas | Leaflet, React-Leaflet, OpenStreetMap, Nominatim | Geolocalizacao, mapa de ocorrencias e busca de endereco |
| Banco de dados | Supabase/PostgreSQL | Persistencia de usuarios, protocolos, prioridades e logs |
| Backend | Java 21, Spring Boot 3, Spring Security, JPA/Hibernate | API, autenticacao, regras de negocio e persistencia |
| Migracoes | Flyway e migrations SQL do Supabase | Versionamento do schema do banco |
| Seguranca | bcrypt, JWT, controle por perfil, variaveis de ambiente | Protecao de autenticacao e dados sensiveis |
| Exportacao | xlsx | Geracao de planilhas para analise externa |
| IA | Supabase Edge Function, OpenRouter e Gemini 2.5 Flash | Classificacao de prioridade dos protocolos |
| Auditoria de IA | `ai_priority_jobs`, `ai_job_logs`, `ai_priority`, `ai_status` | Registro de processamento, resultado, falhas e alteracoes manuais |

### Metodos de Ciencia de Dados

O projeto aplica metodos de Ciencia de Dados de forma incremental:

- Coleta estruturada dos dados de protocolo.
- Padronizacao de status e categorias.
- Transformacao de dados brutos em indicadores.
- Analise de frequencia por status, categoria e periodo.
- Calculo de taxa de resolucao e risco de SLA.
- Priorizacao administrativa com apoio de IA.
- Exportacao para auditoria, planilhas e analises complementares.

### Metodos de IA

O modulo de IA funciona como um sistema de apoio a decisao:

1. Le os dados principais do protocolo: categoria e descricao.
2. Envia esses dados para uma Edge Function.
3. A Edge Function consulta o modelo Gemini 2.5 Flash via OpenRouter.
4. O modelo classifica a prioridade como baixa, media, alta ou critica.
5. O resultado e salvo no banco e exibido para o servidor.
6. O servidor pode aceitar, regenerar ou alterar a prioridade.
7. As acoes ficam registradas em logs de auditoria.

No dashboard, o sistema tambem mantem indicadores explicaveis, como risco de SLA, eficiencia, categoria critica e recomendacoes operacionais. Assim, a IA nao aparece isolada; ela faz parte de uma visao maior de gestao por dados.

### Seguranca, LGPD e governanca

Como o sistema lida com dados de cidadaos, a evolucao de IA respeita principios de governanca:

- Minimizar o envio de dados pessoais para servicos externos.
- Usar a descricao e a categoria como base principal da classificacao.
- Evitar exposicao de CPF, telefone e identificacao pessoal em areas publicas.
- Registrar logs de classificacoes automatizadas e alteracoes manuais.
- Permitir revisao humana antes de qualquer decisao administrativa final.
- Manter rastreabilidade sobre quem alterou a prioridade e por qual motivo.
- Preparar dados anonimizados para relatorios publicos.

---

## 4. Cronograma com destaque a Ciencia de Dados e IA

| Periodo | Status | Atividades | Destaque em dados e IA |
|---|---|---|---|
| 25/02 a 15/03/2026 | Concluido | Definicao do problema, publico-alvo, jornada do cidadao e primeiras telas | Levantamento das variaveis iniciais de protocolo |
| 16/03 a 31/03/2026 | Concluido | Implementacao do frontend, rotas, login, cadastro e abertura de solicitacao | Estruturacao dos campos basicos para analise futura |
| 01/04 a 20/04/2026 | Concluido | Backend Java/Spring Boot, entidades, repositorios, autenticacao e migracoes | Criacao das tabelas de usuarios e protocolos |
| 21/04 a 10/05/2026 | Concluido | Dashboard, relatorios, mapa e exportacao de dados | Primeiros KPIs, graficos e relatorios gerenciais |
| 11/05 a 22/05/2026 | Concluido | Painel de insights inteligentes no dashboard administrativo | Risco de SLA, categoria critica, fila priorizada e recomendacoes |
| 23/05 a 25/05/2026 | Concluido | Finalizacao da IA de prioridade, Edge Function, badges, regeneracao, troca manual e logs | Classificacao funcional por IA com auditoria |
| 26/05 a 05/06/2026 | Em andamento | Melhorar dados geograficos, filtros por bairro, status e prioridade | Preparar base para analise territorial |
| 06/06 a 20/06/2026 | Futuro | Resumos de protocolos, sugestoes de encaminhamento e validacao com usuarios | Evolucao da IA generativa e metricas de aceitacao |
| 21/06 a 30/06/2026 | Futuro | Testes, ajustes de governanca e preparacao para demonstracao final | Relatorios executivos e consolidacao do pipeline de dados |

---

## Link do video

Apos gravar e publicar o pitch no YouTube como **nao listado**, substituir o link abaixo:

https://youtu.be/INSERIR_LINK_DO_VIDEO_NAO_LISTADO

---

## Conclusao

O **Cidadao Informa** evoluiu de um sistema de registro de ocorrencias para uma plataforma de gestao publica orientada por dados e IA. A etapa atual demonstra front-end funcional, backend estruturado, banco de dados, recursos de seguranca, dashboards, relatorios, mapas e um modulo de IA ja funcionando para classificacao de prioridade.

O principal diferencial e que a IA foi implementada com responsabilidade: ela apoia a triagem, mas nao substitui o servidor publico; gera prioridade, mas permite revisao humana; acelera a gestao, mas mantem logs de auditoria. Dessa forma, o projeto entrega valor publico com transparencia, rastreabilidade e foco em acessibilidade urbana.
