---
tags: [type/flow, domain/auth, layer/backend]
aliases: [Login Sequence, Fluxo de Login]
---

# Login Flow

> Sequence for authenticating a user via CPF + password.

## Production Path (Supabase JS SDK)

```mermaid
sequenceDiagram
    actor User
    participant FE as React Frontend
    participant API as api.ts
    participant SB as Supabase

    User->>FE: Enters CPF + Password → clicks Login
    FE->>API: api.login(cpf, password)
    API->>SB: SELECT * FROM users WHERE cpf = ?
    SB-->>API: User row (with password_hash)
    API->>API: bcrypt.compare(password, password_hash)
    alt Invalid
        API-->>FE: throw Error("CPF ou senha inválidos.")
        FE-->>User: Toast error message
    else Valid
        API->>API: createSessionToken(user) → Base64 payload
        API-->>FE: { token, userId, name, role, ... }
        FE->>FE: localStorage.setItem("cidadaoinforma_token", token)
        FE-->>User: Redirect to / (citizen) or /admin (admin)
    end
```

## Spring Boot Path (academic/local)

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant AC as AuthController
    participant LUC as LoginUseCase
    participant UR as UserRepository
    participant JWT as JwtServiceImpl

    FE->>AC: POST /api/auth/login { cpf, password }
    AC->>LUC: execute(LoginInputDto)
    LUC->>UR: getByCpf(cpf)
    UR-->>LUC: Optional<User>
    LUC->>LUC: AuthUtils.verifyPassword(password, hash)
    LUC->>JWT: generateToken(user)
    JWT-->>LUC: signed JWT string
    LUC-->>AC: AuthOutputDto
    AC-->>FE: 200 OK { token, name, role, ... }
```

## Session Storage

The frontend stores a **Base64-encoded session token** (not a signed JWT) in `localStorage` under the key `cidadaoinforma_token`. This is decoded by `decodeSessionToken()` in `api.ts` for subsequent calls.

## Related

- [[Auth Domain]]
- [[AuthController]]
- [[LoginUseCase]]
- [[JwtService]]
- [[User Entity]]
- [[LoginInputDto]] → [[AuthOutputDto]]
- [[Supabase]]
