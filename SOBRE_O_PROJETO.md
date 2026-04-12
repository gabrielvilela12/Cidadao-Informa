# Cidadao Informa

## Sobre o projeto

O **Cidadao Informa** e uma plataforma digital voltada para a zeladoria urbana. A proposta do projeto e aproximar a populacao da administracao publica por meio de um sistema onde o cidadao pode registrar ocorrencias da cidade, acompanhar protocolos e visualizar informacoes de atendimento, enquanto a prefeitura tem acesso a paineis de triagem, mapas e relatorios.

O sistema foi concebido no contexto do HackGov/FIAP com foco em problemas comuns do ambiente urbano, como buracos em vias, falhas de iluminacao publica, descarte irregular e outras demandas de manutencao. A aplicacao busca tornar esse fluxo mais simples, rastreavel e acessivel.

## Objetivos principais

- Facilitar a abertura de solicitacoes de zeladoria pelo cidadao.
- Centralizar o acompanhamento dos protocolos em uma experiencia digital unica.
- Apoiar a triagem e a gestao das ocorrencias pela administracao publica.
- Dar mais transparencia ao andamento dos atendimentos.
- Incentivar uma comunicacao mais rapida entre populacao e prefeitura.

## Como o sistema esta organizado

O repositorio contem mais de uma frente de implementacao:

- **Frontend Web** em React + TypeScript com Vite.
- **Backend principal em .NET 8**, estruturado em camadas com enfoque em Clean Architecture.
- **Backend Java** complementar com classes de dominio e estrutura academica de apoio.

## Principais funcionalidades

### Para o cidadao

- Cadastro e login.
- Abertura de nova solicitacao.
- Consulta de protocolos.
- Visualizacao de detalhes do protocolo.
- Acesso a mapa e servicos da cidade.
- Recursos de acessibilidade e atalhos de navegacao.

### Para a administracao

- Dashboard administrativo.
- Fila de solicitacoes.
- Visualizacao em mapa.
- Relatorios gerenciais.

## Tecnologias utilizadas

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Leaflet / React-Leaflet
- Recharts
- Supabase

### Backend .NET

- .NET 8
- ASP.NET Core Web API
- Entity Framework Core
- PostgreSQL
- JWT para autenticacao
- Swagger para documentacao da API

### Estrutura complementar

- Projeto Java com classes de dominio relacionadas ao contexto da aplicacao.

## Valor do projeto

Mais do que registrar reclamacoes, o projeto busca oferecer uma jornada digital de atendimento ao cidadao com foco em usabilidade, organizacao das demandas urbanas e visibilidade sobre o status de cada solicitacao. Isso ajuda tanto quem precisa reportar um problema quanto quem precisa administrar e priorizar as acoes do poder publico.

## Observacao

No momento, o repositorio tambem possui um `README.md` com conflito de merge nao resolvido. Este arquivo foi criado separadamente para servir como uma descricao clara e objetiva do projeto sem alterar esse arquivo existente.
