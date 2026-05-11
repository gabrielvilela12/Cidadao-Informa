---
tags: [type/hub, domain/auth]
aliases: [Authentication, Autenticação, Auth]
---

# Auth Domain

> Handles user registration, login, JWT issuance, and profile retrieval for both citizen and admin roles.

## Class Diagram

```mermaid
classDiagram
    class AuthController {
        +login(LoginInputDto) ResponseEntity
        +register(RegisterInputDto) ResponseEntity
        +getMe(Authentication) ResponseEntity
    }
    class LoginUseCase {
        -UserRepository userRepository
        -JwtService jwtService
        +execute(LoginInputDto) AuthOutputDto
    }
    class RegisterUseCase {
        -UserRepository userRepository
        -JwtService jwtService
        +execute(RegisterInputDto) AuthOutputDto
    }
    class GetMeUseCase {
        -UserRepository userRepository
        +execute(String userId) AuthOutputDto
    }
    class JwtService {
        <<interface>>
        +generateToken(User) String
        +parseToken(String) Optional~AuthenticatedUser~
    }
    class User {
        +String id
        +String name
        +String email
        +String cpf
        +String phone
        +String role
        +String passwordHash
        +Instant createdAt
    }

    AuthController --> LoginUseCase
    AuthController --> RegisterUseCase
    AuthController --> GetMeUseCase
    LoginUseCase --> UserRepository
    LoginUseCase --> JwtService
    RegisterUseCase --> UserRepository
    RegisterUseCase --> JwtService
    GetMeUseCase --> UserRepository
```

## Notes in This Domain

- [[AuthController]]
- [[LoginUseCase]]
- [[RegisterUseCase]]
- [[GetMeUseCase]]
- [[JwtService]]
- [[User Entity]]
- [[LoginInputDto]]
- [[RegisterInputDto]]
- [[AuthOutputDto]]
- [[Login Flow]]
- [[Register Flow]]

## Related Domains

- [[Protocol Domain]] (protocols are owned by authenticated users)
- [[API Overview]] → [[Auth Endpoints]]
- [[Infrastructure Overview]] → [[Supabase]] (user persistence)
