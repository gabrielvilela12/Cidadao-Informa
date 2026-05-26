# Slides - Cidadao Informa

## Slide 1: Cidadao Informa

**Atividade 2 - Enterprise Challenge EGESP**

- HackGov/FIAP
- Zeladoria urbana e acessibilidade
- Ciencia de Dados e IA aplicada a gestao publica

Equipe: Gabriel e Luis Gustavo

## Slide 2: Problema Publico

- Demandas urbanas chegam de forma dispersa e pouco rastreavel.
- Cidadaos tem dificuldade para acompanhar solicitacoes.
- Gestores precisam priorizar com dados, nao apenas por ordem de chegada.

## Slide 3: Solucao

- Plataforma para registrar, acompanhar e gerir protocolos.
- Jornada do cidadao com formulario, endereco, evidencias e mapa.
- Portal do servidor com dashboard, fila, mapa, relatorios e IA.

## Slide 4: Prototipo Atual

- Login, cadastro e perfis cidadao/admin.
- Nova solicitacao em etapas.
- Consulta publica e privada de protocolos.
- Backend Java/Spring Boot, Supabase/PostgreSQL e exportacao em planilhas.

## Slide 5: Ciencia de Dados

- KPIs: total, analise, atraso e resolucao.
- Distribuicao por status e categoria.
- Tendencia mensal de abertura/resolucao.
- Mapas para observar concentracao territorial.

## Slide 6: IA Finalizada

- Classificacao de prioridade funcionando: baixa, media, alta e critica.
- IA analisa categoria e descricao do protocolo.
- Resultado aparece como badge na fila administrativa.
- Servidor pode regenerar IA ou trocar prioridade manualmente.

## Slide 7: Auditoria e Responsabilidade

- Logs IA registram classificacoes e alteracoes manuais.
- A decisao final continua humana.
- O sistema evita tratar a IA como caixa-preta.
- Transparencia, LGPD e rastreabilidade fazem parte da solucao.

## Slide 8: Tecnologias

- React, TypeScript, Vite, Tailwind, Recharts e Leaflet.
- Java 21, Spring Boot 3, Spring Security, JPA e Flyway.
- Supabase/PostgreSQL, bcrypt, JWT e xlsx.
- Supabase Edge Function, OpenRouter e Gemini 2.5 Flash para IA.

## Slide 9: Proximas Evolucoes

- Analise por bairro e mapa de calor.
- Filtros por prioridade, status, categoria e regiao.
- Resumo de protocolos com IA generativa.
- Predicao de risco de atraso e relatorios executivos automaticos.

## Slide 10: Cronograma

- Ate 22/05: MVP funcional, dashboards e insights inteligentes.
- 23/05 a 25/05: IA de prioridade finalizada e funcionando.
- 26/05 a 05/06: filtros, geodados e base analitica.
- Final de junho: validacao, ajustes e documentacao final.
