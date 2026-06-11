# Cidadao Informa

Sistema web de zeladoria publica e acessibilidade urbana desenvolvido para o projeto HackGov/FIAP. A aplicacao conecta cidadaos e administradores publicos para registrar, acompanhar e priorizar solicitacoes de melhoria na cidade.

## Visao geral

O Cidadao Informa permite que cidadaos abram protocolos de problemas urbanos, acompanhem o andamento das solicitacoes e consultem detalhes publicos por numero de protocolo. Para a gestao municipal, o sistema oferece painel administrativo, fila de solicitacoes, mapa interativo, relatorios exportaveis e classificacao de prioridade com apoio de IA.

## Funcionalidades

- Cadastro e login de cidadaos.
- Abertura de solicitacoes com categoria, descricao, endereco, mapa e evidencias visuais.
- Consulta de protocolos do cidadao autenticado.
- Pagina publica de acompanhamento de protocolo.
- Painel administrativo com indicadores, graficos, mapa e fila de triagem.
- Exportacao de relatorios em XLSX.
- Classificacao automatica de prioridade por Edge Function.
- Interface responsiva com foco em uso em desktop e mobile.

## Tecnologias

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Leaflet e React Leaflet
- Recharts
- Lucide React
- Supabase JS
- XLSX

### Backend e infraestrutura

- Supabase PostgreSQL
- Supabase Edge Functions
- Spring Boot em `backend-java`
- Vercel para deploy do frontend

## Estrutura principal

```text
src/                 Aplicacao React
supabase/functions/  Edge Functions usadas pelo frontend
supabase/migrations/ Migrations do banco Supabase
backend-java/        Backend Java/Spring Boot
public/              Arquivos publicos
```

## Como executar o frontend

1. Instale as dependencias:

```bash
npm install
```

2. Crie o arquivo `.env` a partir do `.env.example` e configure as variaveis:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

3. Inicie o servidor local:

```bash
npm run dev
```

Por padrao, o Vite sobe em:

```text
http://localhost:3000
```

## Scripts uteis

```bash
npm run dev      # inicia o ambiente local
npm run build    # gera build de producao
npm run preview  # visualiza o build gerado
npm run lint     # valida tipos TypeScript
```

## Observacoes

- As Edge Functions dependem de variaveis configuradas no Supabase, como `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_SESSION_SECRET` e, para classificacao de prioridade, `OPENROUTER_API_KEY`.
- O arquivo `.env.example` mostra as variaveis esperadas para o frontend.
- O backend Java permanece no reposititorio como alternativa/apoio para APIs com Spring Boot.
