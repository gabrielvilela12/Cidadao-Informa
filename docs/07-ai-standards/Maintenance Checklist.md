---
tags: [type/checklist, domain/ai-standards, process/release]
aliases: [Checklist de Manutencao, Release Checklist]
---

# Maintenance Checklist

> Checklist para cada mudanca relevante no Cidadao Informa.

## Antes de Alterar

- Entender a rota, componente ou endpoint afetado.
- Procurar padroes semelhantes no projeto.
- Verificar se ha mudancas locais nao relacionadas.
- Definir criterio de aceite.

## Durante a Alteracao

- Manter escopo pequeno.
- Usar tipos compartilhados quando existirem.
- Evitar duplicar regra de negocio.
- Usar nomes em portugues nas telas e nomes tecnicos consistentes no codigo.
- Garantir que estados vazios, loading e erro continuem funcionando.

## Frontend

- `npm run lint`
- `npm run build`
- Verificar landing/login quando mudar tema global.
- Verificar dashboard cidadao quando mudar cards ou status.
- Verificar dashboard admin quando mudar dados, IA ou relatorios.
- Verificar responsividade basica.

## Backend

- Rodar testes Maven quando tocar `backend-java`.
- Criar migration Flyway para mudanca de schema.
- Atualizar DTOs e docs de API.
- Validar auth em endpoint protegido.
- Evitar retornar dados pessoais desnecessarios.

## Dados e IA

- Confirmar fonte dos dados.
- Garantir que o calculo e explicavel.
- Documentar limites do modelo.
- Nao expor CPF, telefone ou email em insight publico.
- Conferir se os indicadores batem com a regra descrita.

## Documentacao

Atualizar docs quando mudar:

- Fluxo de usuario.
- Status ou ciclo de vida de protocolo.
- Endpoint ou contrato.
- Schema de banco.
- Padrao visual.
- Prompt, skill ou processo de entrega.

## Antes de Entregar

- Revisar `git status`.
- Listar arquivos alterados.
- Abrir telas principais.
- Rodar lint/build.
- Registrar pendencias.
- Gerar materiais FIAP quando aplicavel.
