---
tags: [domain/auth, layer/api, type/diagram]
aliases: [Auth API, /api/auth]
---

# Auth Endpoints

> Detailed reference for `/api/auth` endpoints.

## POST /api/auth/login

**Auth required:** No

**Request:**
```json
{ "cpf": "12345678901", "password": "secret123" }
```

**Response 200:**
```json
{
  "token": "<JWT>",
  "name": "João Silva",
  "email": "joao@email.com",
  "cpf": "12345678901",
  "role": "citizen",
  "userId": "<uuid>",
  "createdAt": "2026-01-01T00:00:00Z"
}
```

**Response 401:** `{ "message": "CPF ou senha inválidos." }`

---

## POST /api/auth/register

**Auth required:** No

**Request:**
```json
{ "name": "João Silva", "email": "joao@email.com", "cpf": "12345678901", "password": "secret123" }
```

**Response 200:** Same shape as login response (token + profile).

**Response 400:** `{ "message": "<validation error>" }`

---

## GET /api/auth/me

**Auth required:** Yes (`Authorization: Bearer <JWT>`)

**Response 200:** Same shape as login (token field is empty string `""`).

**Response 401:** `{ "message": "Token JWT inválido ou sem identificação do usuário." }`

## Related

- [[API Overview]]
- [[Auth Domain]]
- [[AuthController]]
- [[LoginInputDto]]
- [[RegisterInputDto]]
- [[AuthOutputDto]]
