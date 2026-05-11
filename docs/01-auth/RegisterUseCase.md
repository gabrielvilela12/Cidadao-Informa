---
tags: [domain/auth, layer/backend, type/usecase]
aliases: [Register Use Case, Caso de Uso de Cadastro]
---

# RegisterUseCase

> Validates and persists a new citizen account, returning a signed JWT on success.

## Responsibility

Runs field-level validations, checks CPF/email uniqueness, hashes the password, persists the user, and returns a JWT.

## Validations

| Field | Rule |
|-------|------|
| name | non-blank |
| cpf | exactly 11 digits |
| email | contains `@`, normalized to lowercase |
| password | min 6 characters |
| cpf | unique |
| email | unique |

## Dependencies

- [[User Entity]] via `UserRepository.add()`
- [[JwtService]] → `generateToken()`
- `AuthUtils.hashPassword()` (bcrypt)
- [[RegisterInputDto]] → [[AuthOutputDto]]

## Code Reference

`backend-java/src/main/java/br/com/fiap/hackgov/application/usecase/auth/RegisterUseCase.java`

## Related

- [[Auth Domain]]
- [[AuthController]]
- [[Register Flow]]
