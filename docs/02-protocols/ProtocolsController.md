---
tags: [domain/protocols, layer/backend, layer/api, type/controller]
aliases: [Protocol Controller, /api/protocols]
---

# ProtocolsController

> REST controller that exposes protocol endpoints under `/api/protocols`.

## Endpoints

| Method | Path | Use Case | Auth |
|--------|------|----------|------|
| POST | `/api/protocols` | [[CreateProtocolUseCase]] | Yes |
| GET | `/api/protocols?userId=` | [[GetProtocolsUseCase]] | Yes |

The `userId` query param on GET is optional. If omitted, all protocols are returned (admin use case). If provided, only that user's protocols are returned (citizen use case).

## Code Reference

`backend-java/src/main/java/br/com/fiap/hackgov/api/controller/ProtocolsController.java`

## Related

- [[Protocol Domain]]
- [[Protocol Endpoints]]
- [[CreateProtocolUseCase]]
- [[GetProtocolsUseCase]]
