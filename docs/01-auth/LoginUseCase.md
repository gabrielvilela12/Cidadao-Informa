---
tags: [domain/auth, layer/backend, type/usecase]
aliases: [Login Use Case, Caso de Uso de Login]
---

# LoginUseCase

> Authenticates a user by CPF and password, returning a signed JWT and profile data.

## Responsibility

Looks up the user by CPF, verifies the bcrypt hash, generates a JWT token, and returns `AuthOutputDto`.

## Dependencies

- [[User Entity]] via `UserRepository.getByCpf()`
- [[JwtService]] → `generateToken()`
- `AuthUtils.verifyPassword()` (bcrypt comparison)
- [[LoginInputDto]] → [[AuthOutputDto]]

## Key Logic

```java
User user = userRepository.getByCpf(input.cpf())
        .orElseThrow(() -> new IllegalArgumentException("CPF ou senha inválidos."));

if (!AuthUtils.verifyPassword(input.password(), user.getPasswordHash())) {
    throw new IllegalArgumentException("CPF ou senha inválidos.");
}

String token = jwtService.generateToken(user);
return new AuthOutputDto(token, user.getName(), user.getEmail(), ...);
```

## Code Reference

`backend-java/src/main/java/br/com/fiap/hackgov/application/usecase/auth/LoginUseCase.java`

## Related

- [[Auth Domain]]
- [[AuthController]]
- [[Login Flow]]
- [[JwtService]]
