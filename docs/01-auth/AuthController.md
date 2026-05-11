---
tags: [domain/auth, layer/backend, layer/api, type/controller]
aliases: [Auth Controller, /api/auth]
---

# AuthController

> REST controller that exposes the three auth endpoints under `/api/auth`.

## Responsibility

Receives HTTP requests, delegates to use cases, and wraps responses in `ResponseEntity`. All error handling is catch-and-return (no global exception handler).

## Endpoints

| Method | Path | Use Case | Auth Required |
|--------|------|----------|--------------|
| POST | `/api/auth/login` | [[LoginUseCase]] | No |
| POST | `/api/auth/register` | [[RegisterUseCase]] | No |
| GET | `/api/auth/me` | [[GetMeUseCase]] | Yes (JWT) |

## Dependencies

- [[LoginUseCase]]
- [[RegisterUseCase]]
- [[GetMeUseCase]]
- `AuthenticatedUser` (Spring Security principal record)

## Code Reference

`backend-java/src/main/java/br/com/fiap/hackgov/api/controller/AuthController.java`

## Related

- [[Auth Domain]]
- [[Auth Endpoints]]
- [[Login Flow]]
- [[Register Flow]]
