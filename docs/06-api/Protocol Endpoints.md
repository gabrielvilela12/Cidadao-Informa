---
tags: [domain/protocols, layer/api, type/diagram]
aliases: [Protocol API, /api/protocols]
---

# Protocol Endpoints

> Detailed reference for `/api/protocols` endpoints.

## POST /api/protocols

**Auth required:** Yes

**Request:**
```json
{
  "category": "Buraco na via",
  "description": "Grande buraco na Rua X, próximo ao número 100",
  "address": "Rua X, 100, Bairro Y",
  "userId": "<uuid>"
}
```

**Response 201:**
```json
{
  "id": "<uuid>",
  "category": "Buraco na via",
  "description": "Grande buraco na Rua X, próximo ao número 100",
  "address": "Rua X, 100, Bairro Y",
  "createdAt": "2026-05-11T00:00:00Z",
  "status": "Open",
  "userId": "<uuid>",
  "userName": ""
}
```

**Response 400:** `{ "message": "<error description>" }`

---

## GET /api/protocols?userId={userId}

**Auth required:** Yes

**Query Params:**

| Param | Required | Description |
|-------|----------|-------------|
| userId | No | Filter by citizen. Omit to get all protocols (admin use case). |

**Response 200:** Array of `ProtocolOutputDto`

## Related

- [[API Overview]]
- [[Protocol Domain]]
- [[ProtocolsController]]
- [[ProtocolInputDto]]
- [[ProtocolOutputDto]]
