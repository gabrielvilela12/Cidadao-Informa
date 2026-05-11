---
tags: [domain/auth, layer/api, type/dto]
aliases: [Register Input, Cadastro Payload]
---

# RegisterInputDto

> Input payload for `POST /api/auth/register`.

## Shape

```java
record RegisterInputDto(String name, String email, String cpf, String password) {}
```

| Field | Type | Validation |
|-------|------|-----------|
| name | String | non-blank |
| email | String | contains `@`, lowercased |
| cpf | String | exactly 11 digits, unique |
| password | String | min 6 chars |

## Related

- [[Auth Domain]]
- [[RegisterUseCase]]
- [[AuthController]]
- [[Auth Endpoints]]
