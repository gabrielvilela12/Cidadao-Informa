---
tags: [domain/protocols, layer/backend, type/usecase]
aliases: [Get Protocols, List Protocols]
---

# GetProtocolsUseCase

> Returns a list of protocols, filtered by userId if provided, otherwise all protocols.

## Responsibility

Delegates to `ProtocolRepository.getByUserId()` or `getAll()` depending on whether `userId` is provided. Maps each `Protocol` to `ProtocolOutputDto`, including the user's name from the lazy-loaded `User` relationship.

## Code Reference

`backend-java/src/main/java/br/com/fiap/hackgov/application/usecase/protocol/GetProtocolsUseCase.java`

## Related

- [[Protocol Domain]]
- [[ProtocolsController]]
- [[Protocol Entity]]
- [[ProtocolOutputDto]]
