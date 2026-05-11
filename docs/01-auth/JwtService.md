---
tags: [domain/auth, layer/backend, type/service]
aliases: [JWT, Token Service, Serviço JWT]
---

# JwtService

> Interface for JWT generation and parsing. Implemented by `JwtServiceImpl` in the infrastructure layer.

## Responsibility

Abstracts token issuance and validation so use cases depend on the interface, not the JJWT library directly.

## Interface

```java
public interface JwtService {
    String generateToken(User user);
    Optional<AuthenticatedUser> parseToken(String token);
}
```

## Implementation

`JwtServiceImpl` (infrastructure layer) uses the JJWT library. The JWT payload includes `userId` which is extracted by `JwtAuthenticationFilter` and set as the Spring Security principal (`AuthenticatedUser` record).

## Code Reference

- Interface: `backend-java/src/main/java/br/com/fiap/hackgov/application/service/JwtService.java`
- Impl: `backend-java/src/main/java/br/com/fiap/hackgov/infrastructure/service/JwtServiceImpl.java`
- Filter: `backend-java/src/main/java/br/com/fiap/hackgov/infrastructure/security/JwtAuthenticationFilter.java`

## Related

- [[Auth Domain]]
- [[LoginUseCase]]
- [[RegisterUseCase]]
- [[Login Flow]]
