---
tags: [domain/auth, layer/api, type/dto]
aliases: [Login Input, Login Payload]
---

# LoginInputDto

> Input payload for `POST /api/auth/login`.

## Shape

```java
record LoginInputDto(String cpf, String password) {}
```

| Field | Type | Description |
|-------|------|-------------|
| cpf | String | 11-digit CPF (no formatting) |
| password | String | Plain-text password (hashed server-side) |

## Related

- [[Auth Domain]]
- [[LoginUseCase]]
- [[AuthController]]
- [[Auth Endpoints]]
