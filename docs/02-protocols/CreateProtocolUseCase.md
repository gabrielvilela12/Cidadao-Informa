---
tags: [domain/protocols, layer/backend, type/usecase]
aliases: [Create Protocol, Nova Solicitação Use Case]
---

# CreateProtocolUseCase

> Persists a new protocol/solicitação and returns its output representation.

## Responsibility

Maps `ProtocolInputDto` to a `Protocol` entity, saves it, and returns `ProtocolOutputDto`. The `status` defaults to `Open` and `id` to a new UUID via `@PrePersist`.

## Dependencies

- [[Protocol Entity]] via `ProtocolRepository.add()`
- [[ProtocolInputDto]] → [[ProtocolOutputDto]]

## Code Reference

`backend-java/src/main/java/br/com/fiap/hackgov/application/usecase/protocol/CreateProtocolUseCase.java`

## Related

- [[Protocol Domain]]
- [[ProtocolsController]]
- [[Data Flow]]
