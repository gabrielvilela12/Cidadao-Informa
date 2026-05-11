---
tags: [type/flow, domain/auth, layer/backend]
aliases: [Registration Sequence, Fluxo de Cadastro]
---

# Register Flow

> Sequence for registering a new citizen account.

## Production Path (Supabase JS SDK)

```mermaid
sequenceDiagram
    actor User
    participant FE as React Frontend
    participant API as api.ts
    participant SB as Supabase

    User->>FE: Fills name, email, CPF, password → clicks Cadastrar
    FE->>API: api.register(name, email, cpf, password)
    API->>SB: SELECT id FROM users WHERE cpf = ?
    alt CPF exists
        SB-->>API: existing row
        API-->>FE: throw Error("Já existe uma conta com este CPF.")
    end
    API->>SB: SELECT id FROM users WHERE email = ?
    alt Email exists
        SB-->>API: existing row
        API-->>FE: throw Error("Já existe uma conta com este E-mail.")
    end
    API->>API: bcrypt.hash(password, 10)
    API->>SB: INSERT INTO users { id, full_name, email, cpf, role:"citizen", password_hash, created_at }
    SB-->>API: inserted User row
    API->>API: createSessionToken(user)
    API-->>FE: { token, userId, name, role, ... }
    FE->>FE: localStorage.setItem("cidadaoinforma_token", token)
    FE-->>User: Redirect to /
```

## Validations (Spring Boot path)

`RegisterUseCase` enforces these rules before persisting:

| Field | Rule |
|-------|------|
| name | non-blank |
| cpf | exactly 11 digits |
| email | contains `@`, normalized to lowercase |
| password | minimum 6 characters |
| cpf | unique in database |
| email | unique in database |

## Related

- [[Auth Domain]]
- [[AuthController]]
- [[RegisterUseCase]]
- [[User Entity]]
- [[RegisterInputDto]] → [[AuthOutputDto]]
- [[Supabase]]
