---
tags: [type/hub, domain/protocols]
aliases: [Protocols, Solicitações, Protocolos]
---

# Protocol Domain

> Manages the full lifecycle of citizen service requests (solicitações/protocolos) from creation to closure.

## Class Diagram

```mermaid
classDiagram
    class ProtocolsController {
        +createProtocol(ProtocolInputDto) ResponseEntity
        +getProtocols(userId) ResponseEntity
    }
    class CreateProtocolUseCase {
        -ProtocolRepository repository
        +execute(ProtocolInputDto) ProtocolOutputDto
    }
    class GetProtocolsUseCase {
        -ProtocolRepository repository
        +execute(String userId) List~ProtocolOutputDto~
    }
    class Protocol {
        +String id
        +String category
        +String description
        +String address
        +Instant createdAt
        +ProtocolStatus status
        +String userId
        +String requester
    }
    class ProtocolStatus {
        <<enumeration>>
        Open
        InProgress
        Resolved
        Closed
    }

    ProtocolsController --> CreateProtocolUseCase
    ProtocolsController --> GetProtocolsUseCase
    CreateProtocolUseCase --> ProtocolRepository
    GetProtocolsUseCase --> ProtocolRepository
    Protocol --> ProtocolStatus
    Protocol --> User
```

## Notes in This Domain

- [[ProtocolsController]]
- [[CreateProtocolUseCase]]
- [[GetProtocolsUseCase]]
- [[Protocol Entity]]
- [[ProtocolInputDto]]
- [[ProtocolOutputDto]]
- [[Protocol Lifecycle]]

## Related Domains

- [[Auth Domain]] (protocols belong to [[User Entity]])
- [[Admin Domain]] (admins manage the queue)
- [[Citizen Domain]] (citizens create and track protocols)
- [[API Overview]] → [[Protocol Endpoints]]
