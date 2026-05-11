---
tags: [domain/auth, layer/backend, type/usecase]
aliases: [GetMe, Meu Perfil]
---

# GetMeUseCase

> Returns the profile of the currently authenticated user by their userId extracted from the JWT.

## Responsibility

Looks up the user by ID and returns their data. Returns an `AuthOutputDto` with an empty token field (token is not re-issued on `/me`).

## Dependencies

- [[User Entity]] via `UserRepository.getById()`
- [[AuthOutputDto]]

## Code Reference

`backend-java/src/main/java/br/com/fiap/hackgov/application/usecase/auth/GetMeUseCase.java`

## Related

- [[Auth Domain]]
- [[AuthController]]
- [[User Entity]]
