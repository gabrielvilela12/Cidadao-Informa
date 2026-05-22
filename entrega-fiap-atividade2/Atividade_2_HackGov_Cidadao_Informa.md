# ATIVIDADE 2 - ENTERPRISE Challenge - EGESP

## Cidadão Informa: Ciência de Dados e IA no Projeto HackGov

**Grupo:** [preencher nomes, RMs e fotos no slide de abertura]  
**Data:** 22/05/2026  
**Link do vídeo pitch:** https://youtu.be/INSERIR_LINK_DO_VIDEO_NAO_LISTADO

---

## 1. Contextualização do Projeto

O Cidadão Informa é uma plataforma HackGov voltada à transformação digital da gestão pública municipal, com foco em zeladoria urbana e acessibilidade. O sistema permite que cidadãos registrem ocorrências como problemas em calçadas, rampas bloqueadas, falhas de sinalização visual ou auditiva e outras barreiras urbanas. Do lado da administração pública, a prefeitura acompanha a fila de solicitações, visualiza mapas, consulta dashboards e gera relatórios para apoiar a tomada de decisão.

A proposta de valor do projeto é transformar um fluxo geralmente manual, disperso e pouco transparente em um processo digital rastreável. O cidadão passa a ter protocolo, acompanhamento de status e canal de consulta; o servidor público passa a ter visão consolidada da demanda, indicadores de atendimento e priorização dos casos mais críticos.

### Evolução do protótipo

Nesta etapa, o sistema já apresenta:

- Tela inicial e fluxo de autenticação.
- Cadastro e login de cidadãos.
- Registro de nova solicitação em etapas.
- Classificação por categorias de acessibilidade: física, visual, auditiva e outros.
- Formulário com endereço, descrição, evidências por imagem e mapa interativo.
- Consulta de protocolos pelo cidadão.
- Tela pública de acompanhamento de protocolo.
- Dashboard administrativo com indicadores em tempo real.
- Fila de solicitações, mapa administrativo e relatórios.
- Exportação de dados em planilhas.
- Backend Java/Spring Boot com autenticação JWT, JPA, Flyway e banco PostgreSQL/Supabase.
- Práticas de cibersegurança como hash de senha, separação de perfis, tokens e controle de rotas.

### Contribuições da 1ª mentoria EGESP

A 1ª mentoria com a EGESP, realizada em 05/05/2026, reforçou a necessidade de demonstrar valor público de forma objetiva. Para o nosso projeto, isso orientou quatro decisões principais:

- Dar mais destaque a indicadores de gestão, como volume de protocolos, taxa de resolução, atrasos e distribuição por categoria.
- Tratar IA como apoio à decisão, e não como substituição automática do servidor público.
- Valorizar dados confiáveis, rastreáveis e explicáveis, principalmente por se tratar de governo e serviço público.
- Considerar LGPD, segurança e transparência desde o MVP, evitando exposição indevida de dados pessoais do cidadão.

Com isso, o projeto passou a enfatizar dashboards, relatórios, fila priorizada e um primeiro módulo de insights inteligentes para auxiliar a triagem.

---

## 2. Ciência de Dados e Uso de IA

### Atualizações implementadas

O protótipo passou a usar os dados dos protocolos como base para análise gerencial. As principais atualizações relacionadas a Ciência de Dados e IA são:

- Consolidação de indicadores no dashboard administrativo.
- Cálculo de total de solicitações, chamados em análise, atrasos e taxa de resolução.
- Distribuição por status e por categoria.
- Tendência mensal de solicitações abertas e resolvidas.
- Relatórios com exportação em planilha para análise externa.
- Visualização geográfica por mapa, permitindo observar concentração territorial das demandas.
- Novo bloco de **Insights de IA e Ciência de Dados** no dashboard administrativo.

O bloco inteligente implementado é um MVP de IA explicável. Ele calcula uma pontuação de prioridade para protocolos ativos considerando:

- Status do chamado.
- Tempo desde a abertura.
- Categoria de acessibilidade.
- Presença de termos críticos na descrição, como risco, acidente, idoso, escola, hospital, rampa, calçada e bloqueio.
- Sinais de atraso ou impacto operacional.

O resultado aparece para o gestor como:

- Risco de SLA.
- Taxa de eficiência.
- Categoria crítica.
- Fila priorizada com score e justificativas.
- Recomendações operacionais.

### Como a IA contribui para a proposta de valor

A IA contribui para reduzir o tempo de triagem e dar mais clareza sobre o que precisa ser atendido primeiro. Em vez de apenas listar protocolos por ordem de chegada, o sistema passa a sugerir prioridades com base em sinais de risco e impacto social. Isso é especialmente importante em acessibilidade, pois uma rampa bloqueada, uma calçada quebrada ou uma sinalização ausente pode afetar diretamente pessoas com deficiência, idosos, crianças e outros grupos vulneráveis.

O modelo foi desenhado para ser interpretável. O servidor visualiza não apenas o score, mas também os motivos que levaram à priorização. Assim, a decisão final continua humana, mas apoiada por dados.

### Planejamento a partir daqui

As próximas evoluções previstas em Ciência de Dados e IA são:

- Enriquecer a base de dados com bairro, latitude, longitude, secretaria responsável, prazo de SLA e histórico de alterações.
- Criar análise por região para identificar bairros com maior recorrência.
- Implementar classificação automática de categoria a partir da descrição do cidadão.
- Usar IA generativa para resumir protocolos longos e sugerir encaminhamentos.
- Avaliar imagens anexadas para identificar tipo de ocorrência e qualidade da evidência.
- Criar previsão de risco de atraso com base no histórico.
- Gerar relatórios executivos automáticos para gestores.
- Preparar dados anonimizados para transparência pública.

### Mudanças em relação ao planejado

Inicialmente, o projeto tratava a zeladoria urbana de maneira mais ampla. Nesta fase, o foco foi refinado para acessibilidade urbana, pois esse recorte torna o problema mais claro, mensurável e alinhado a impacto social. Outra mudança foi a migração acadêmica do backend para Java/Spring Boot, mantendo Supabase/PostgreSQL como base de dados e permitindo uma arquitetura mais adequada para a disciplina.

Também optamos por iniciar a IA com um modelo heurístico explicável antes de depender de uma API generativa externa. Essa decisão reduz custo, facilita demonstração, evita exposição desnecessária de dados pessoais e permite explicar melhor a lógica para professores, mentores e usuários públicos.

---

## 3. Materiais e Métodos para Ciência de Dados e IA

### Tecnologias utilizadas

| Camada | Tecnologias e ferramentas | Uso no projeto |
|---|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, React Router | Interface do cidadão e do servidor público |
| Visualização de dados | Recharts | Dashboards, gráficos e relatórios |
| Mapas | Leaflet, React-Leaflet, OpenStreetMap, Nominatim | Geolocalização, mapa de ocorrências e busca de endereço |
| Banco de dados | Supabase/PostgreSQL | Persistência de usuários e protocolos |
| Backend | Java 21, Spring Boot 3, Spring Security, JPA/Hibernate | API, autenticação, regras de negócio e persistência |
| Migrações | Flyway | Versionamento do schema do banco |
| Segurança | bcrypt, JWT, controle por perfil, variáveis de ambiente | Proteção de autenticação e dados sensíveis |
| Exportação | xlsx | Geração de planilhas para análise externa |
| IA planejada | Google GenAI/Gemini ou API similar | Resumos, classificação textual e apoio à triagem em fases futuras |

### Métodos de Ciência de Dados

O projeto aplica métodos de Ciência de Dados de forma incremental:

- Coleta estruturada dos dados de protocolo.
- Padronização de status e categorias.
- Transformação de dados brutos em indicadores.
- Análise de frequência por status, categoria e período.
- Cálculo de taxa de resolução e risco de SLA.
- Priorização por score.
- Exportação para auditoria, planilhas e análises complementares.

### Métodos de IA

O MVP usa um modelo heurístico explicável, adequado para a fase atual do protótipo. Esse modelo funciona como um sistema de apoio à decisão:

1. Lê os protocolos ativos.
2. Calcula idade do chamado e status.
3. Avalia categoria e termos críticos.
4. Gera score de 0 a 100.
5. Ordena a fila por prioridade.
6. Apresenta justificativas e recomendações ao gestor.

Nas próximas fases, o mesmo fluxo poderá ser substituído ou complementado por modelos de NLP, classificação supervisionada e IA generativa, mantendo revisão humana e critérios de governança.

### Segurança, LGPD e governança

Como o sistema lida com dados de cidadãos, a evolução de IA deve respeitar:

- Minimização de dados pessoais.
- Evitar envio de CPF, telefone e identificação pessoal para APIs externas sem necessidade.
- Registro de logs de decisões automatizadas.
- Explicabilidade das recomendações.
- Revisão humana antes de ações administrativas.
- Preparação de dados anonimizados para relatórios públicos.

---

## 4. Cronograma com destaque à Ciência de Dados e IA

| Período | Status | Atividades | Destaque em dados e IA |
|---|---|---|---|
| 25/02 a 15/03/2026 | Concluído | Definição do problema, público-alvo, jornada do cidadão e primeiras telas | Levantamento das variáveis iniciais de protocolo |
| 16/03 a 31/03/2026 | Concluído | Implementação do frontend, rotas, login, cadastro e abertura de solicitação | Estruturação dos campos básicos para análise futura |
| 01/04 a 20/04/2026 | Concluído | Backend Java/Spring Boot, entidades, repositórios, autenticação e migrações | Criação das tabelas de usuários e protocolos |
| 21/04 a 10/05/2026 | Concluído | Dashboard, relatórios, mapa e exportação de dados | Primeiros KPIs, gráficos e relatórios gerenciais |
| 11/05 a 22/05/2026 | Concluído | Implementação do painel de insights inteligentes no dashboard administrativo | Score de prioridade, risco de SLA, categoria crítica e recomendações |
| 23/05 a 05/06/2026 | Em andamento | Melhorar dados geográficos, filtros por bairro e status, revisão visual do dashboard | Preparar base para análise territorial |
| 06/06 a 20/06/2026 | Futuro | Classificação automática de categoria e resumo textual de protocolos | Integração com IA generativa ou modelo NLP |
| 21/06 a 30/06/2026 | Futuro | Testes com usuários, validação dos scores e ajustes de governança | Métricas de acurácia, aceitação do servidor e impacto na triagem |
| Julho/2026 | Futuro | Preparação para demonstração final e documentação técnica | Relatórios executivos e versão final do pipeline de dados |

---

## Link do vídeo

Após gravar e publicar o pitch no YouTube como **não listado**, substituir o link abaixo:

https://youtu.be/INSERIR_LINK_DO_VIDEO_NAO_LISTADO

---

## Conclusão

O Cidadão Informa evoluiu de um sistema de registro de ocorrências para uma plataforma de gestão pública orientada por dados. A etapa atual demonstra front-end funcional, backend estruturado, banco de dados, recursos de segurança, dashboards e um primeiro módulo de IA explicável. O próximo passo é evoluir a base analítica e integrar modelos de classificação e resumo para apoiar ainda mais a gestão pública sem perder transparência, LGPD e revisão humana.
