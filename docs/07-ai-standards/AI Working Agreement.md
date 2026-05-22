---
tags: [type/guide, domain/ai-standards, process/maintenance]
aliases: [Acordo de Trabalho IA, Working Agreement]
---

# AI Working Agreement

> Regras para manter colaboracao com IA previsivel, segura e util no Cidadao Informa.

## Contexto Minimo Para Toda Tarefa

Ao pedir ajuda para uma IA, informe:

- Objetivo da mudanca.
- Tela, rota, componente ou camada afetada.
- O que nao deve ser alterado.
- Resultado esperado para usuario cidadao, servidor ou avaliador FIAP.
- Como validar: comando, fluxo visual ou criterio de aceite.

## Regras de Engenharia

- Ler arquivos relevantes antes de alterar.
- Preferir padroes existentes do projeto.
- Evitar refatoracoes fora do escopo.
- Nao remover mudancas de outra pessoa sem confirmacao.
- Manter TypeScript sem erros.
- Tratar warnings de build quando forem relacionados a mudanca feita.
- Atualizar docs quando uma regra, fluxo, API, schema, prompt ou padrao visual mudar.

## Regras de Produto Publico

- Cidadao deve entender o que fazer sem treinamento.
- Servidor deve ver prioridade, status e proximo passo com clareza.
- Toda IA decisoria deve explicar o motivo da recomendacao.
- Evitar linguagem tecnica em telas para cidadao.
- Evitar expor CPF, telefone, email ou dados sensiveis em links publicos.

## Definition of Done

Uma tarefa so esta pronta quando:

- O comportamento solicitado foi implementado.
- A tela relevante foi verificada visualmente quando houver UI.
- `npm run lint` passou para o frontend.
- `npm run build` passou quando a mudanca impacta build.
- Testes backend foram executados quando a mudanca tocar `backend-java`.
- Nao ha texto ilegivel, sobreposto ou com contraste ruim.
- A documentacao foi atualizada quando necessario.

## Resposta Final Esperada

Ao finalizar, a IA deve informar:

- Arquivos alterados.
- Comportamento implementado.
- Validacoes executadas.
- Pendencias ou riscos restantes.
