---
tags: [domain/auth, layer/api, type/dto]
aliases: [Auth Response, Auth Output, Login Response]
---

# AuthOutputDto

> Unified output payload returned by login, register, and getMe endpoints.

## Shape

```java
record AuthOutputDto(
    String token,
    String name,
    String email,
    String cpf,
    String role,
    String userId,
    Instant createdAt
) {}
```

## Notes

- `token` is an empty string `""` when returned by [[GetMeUseCase]] (not re-issued on `/me`)
- `role` is either `"citizen"` or `"admin"` — drives routing in the frontend `App.tsx`

## Related

- [[Auth Domain]]
- [[LoginUseCase]]
- [[RegisterUseCase]]
- [[GetMeUseCase]]
- [[Auth Endpoints]]
