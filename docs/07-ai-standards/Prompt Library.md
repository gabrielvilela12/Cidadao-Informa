---
tags: [type/reference, domain/ai-standards, process/prompts]
aliases: [Prompts, Biblioteca de Prompts]
---

# Prompt Library

> Prompts reutilizaveis para manter qualidade e consistencia nas proximas manutencoes.

## Prompt Base Para Qualquer Tarefa

```text
Voce esta trabalhando no projeto Cidadao Informa, um sistema HackGov/FIAP de zeladoria e acessibilidade urbana.

Objetivo:
[descreva o resultado esperado]

Contexto:
- Frontend: React + TypeScript + Vite + Tailwind.
- Backend: Java 21 + Spring Boot + JPA + PostgreSQL/Supabase.
- Visual: seguir padrao institucional, com azul institucional como primario.
- IA: deve ser explicavel e apoiar decisao humana.
- LGPD: nao expor dados pessoais em areas publicas.

Arquivos/rotas afetadas:
[liste arquivos, paginas ou endpoints]

Regras:
- Leia o codigo relevante antes de alterar.
- Mantenha o escopo pequeno.
- Nao remova mudancas nao relacionadas.
- Valide com npm run lint e npm run build quando tocar frontend.
- Ao final, informe arquivos alterados, validacoes e riscos.
```

## Feature Frontend

```text
Implemente a funcionalidade [nome] na tela [rota/componente].

Comportamento esperado:
[criterios de aceite]

Padrao visual:
- Usar identidade publica brasileira.
- Garantir contraste e responsividade.
- Nao usar textos explicativos demais dentro da interface.
- Evitar cards aninhados.

Depois de implementar, verifique visualmente desktop e mobile e rode lint/build.
```

## Bugfix Visual

```text
Corrija o bug visual abaixo sem refatorar telas nao relacionadas.

Bug:
[descreva ou cole print]

Onde acontece:
[rota/componente]

Cuidados:
- Preservar paleta institucional.
- Garantir contraste do texto no fundo.
- Evitar regras globais agressivas que quebrem outras telas.
- Se criar CSS global, limitar com classe especifica.

Valide com screenshot ou descricao visual e rode npm run lint.
```

## Code Review

```text
Faca uma revisao de codigo com foco em bugs, regressao, seguranca, LGPD, acessibilidade e testes.

Escopo:
[branch/arquivos/diff]

Formato esperado:
- Achados por severidade.
- Arquivo e linha.
- Impacto real para usuario ou manutencao.
- Sugestao objetiva de correcao.
- Se nao houver achados, diga claramente e cite riscos residuais.
```

## Refatoracao Segura

```text
Refatore [modulo/componente] mantendo o comportamento atual.

Objetivo da refatoracao:
[reduzir duplicacao, melhorar legibilidade, isolar regra etc.]

Restricoes:
- Nao mudar contrato publico.
- Nao alterar layout sem necessidade.
- Manter nomes existentes quando eles forem usados em outras telas.
- Criar abstracao apenas se reduzir complexidade real.

Validacao:
[comandos e fluxos]
```

## Backend API

```text
Implemente/ajuste o endpoint [metodo + rota] no backend Java.

Contrato esperado:
Request:
[campos]

Response:
[campos]

Regras:
- Controller deve ser fino.
- Use case concentra regra.
- Repository concentra persistencia.
- Validar entradas.
- Proteger endpoint se houver dados sensiveis.
- Atualizar docs de API.

Valide com testes Maven ou, se nao houver, explique como testar manualmente.
```

## Ciencia de Dados e IA

```text
Evolua a funcionalidade de dados/IA [nome].

Objetivo:
[exemplo: priorizar protocolos, prever atraso, resumir ocorrencia]

Dados disponiveis:
[campos existentes]

Regras:
- A recomendacao deve ser explicavel.
- Nao enviar dados pessoais para terceiros sem necessidade.
- Mostrar limitacoes do modelo.
- Manter revisao humana no fluxo administrativo.
- Atualizar docs e pitch se a mudanca for relevante para FIAP/EGESP.

Entregue tambem criterios de avaliacao da qualidade do modelo.
```

## Atualizacao de Documentacao

```text
Atualize a documentacao do projeto para refletir [mudanca].

Inclua:
- Contexto.
- O que mudou.
- Como executar ou validar.
- Impacto em frontend/backend/dados/seguranca.
- Links internos para docs relacionadas.

Use Markdown claro, com secoes curtas e exemplos quando necessario.
```

## Preparacao de Entrega FIAP

```text
Prepare materiais de entrega FIAP para a fase [fase/atividade].

Itens obrigatorios:
[cole o enunciado ou checklist]

Use o estado real do projeto:
- Frontend, backend, banco, seguranca, IA e dashboards.
- Nao inventar funcionalidades nao implementadas.
- Separar o que esta pronto, em andamento e planejado.
- Gerar roteiro de pitch objetivo.

Entregue arquivos Markdown e, quando possivel, PDF/HTML.
```
