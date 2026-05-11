---
tags: [domain/protocols, layer/api, type/dto]
aliases: [Protocol Input, Nova Solicitação Payload]
---

# ProtocolInputDto

> Input payload for `POST /api/protocols`.

## Shape

```java
record ProtocolInputDto(String category, String description, String address, String userId) {}
```

| Field | Type | Description |
|-------|------|-------------|
| category | String | Urban issue category (e.g., "Buraco na via") |
| description | String | Detailed description |
| address | String | Location string |
| userId | String | ID of the authenticated citizen |

## Related

- [[Protocol Domain]]
- [[CreateProtocolUseCase]]
- [[ProtocolsController]]
