---
tags: [type/hub, domain/overview, layer/api]
aliases: [API, REST API, Endpoints]
---

# API Overview

> All REST endpoints exposed by the Spring Boot backend.

## Endpoint Map

```mermaid
flowchart LR
    API[Spring Boot API :8080]
    API --> Auth[/api/auth]
    API --> Protocols[/api/protocols]
    Auth --> Login[POST /login]
    Auth --> Register[POST /register]
    Auth --> Me[GET /me]
    Protocols --> Create[POST /]
    Protocols --> GetAll[GET /?userId=]
```

## Security

- `POST /api/auth/login` and `POST /api/auth/register` are public
- All other endpoints require `Authorization: Bearer <JWT>` header
- Handled by `JwtAuthenticationFilter` in the security chain — see [[JwtService]]

## Notes in This Domain

- [[Auth Endpoints]]
- [[Protocol Endpoints]]
- [[API Contracts]]

## Related

- [[Architecture]]
- [[AuthController]]
- [[ProtocolsController]]
- [[JwtService]]
