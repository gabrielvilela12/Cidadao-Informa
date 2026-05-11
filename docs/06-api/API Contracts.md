---
tags: [layer/api, type/diagram, domain/overview]
aliases: [Contracts, API Types, Tipos da API]
---

# API Contracts

> Quick-reference for all request and response shapes used across the API.

## Input Types

| DTO | Used By | Fields |
|-----|---------|--------|
| [[LoginInputDto]] | POST /api/auth/login | cpf, password |
| [[RegisterInputDto]] | POST /api/auth/register | name, email, cpf, password |
| [[ProtocolInputDto]] | POST /api/protocols | category, description, address, userId |

## Output Types

| DTO | Returned By | Key Fields |
|-----|------------|------------|
| [[AuthOutputDto]] | login, register, me | token, name, role, userId |
| [[ProtocolOutputDto]] | GET/POST /api/protocols | id, status, category, userName |

## Error Shape

All error responses use:
```json
{ "message": "Human-readable error description" }
```

Implemented by `ErrorResponse` record:

```java
// backend-java/src/main/java/br/com/fiap/hackgov/api/response/ErrorResponse.java
record ErrorResponse(String message) {}
```

## Related

- [[API Overview]]
- [[Auth Endpoints]]
- [[Protocol Endpoints]]
