---
tags: [domain/protocols, layer/api, type/dto]
aliases: [Protocol Output, Protocol Response]
---

# ProtocolOutputDto

> Output representation of a protocol returned by the API.

## Shape

```java
record ProtocolOutputDto(
    String id, String category, String description,
    String address, Instant createdAt, String status,
    String userId, String userName
) {}
```

## Notes

- `status` is the enum name as a string: `"Open"`, `"InProgress"`, `"Resolved"`, `"Closed"`
- `userName` is populated from the joined [[User Entity]]; may be `"Unknown"` if user not loaded

## Related

- [[Protocol Domain]]
- [[GetProtocolsUseCase]]
- [[CreateProtocolUseCase]]
- [[Protocol Lifecycle]]
