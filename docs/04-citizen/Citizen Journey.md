---
tags: [type/flow, domain/citizen, type/diagram]
aliases: [User Journey, Jornada do Cidadão]
---

# Citizen Journey

> End-to-end flowchart of the citizen experience from landing to protocol resolution.

## Flowchart

```mermaid
flowchart TD
    A([Landing Page]) --> B{Has account?}
    B -- No --> C[Register /cadastro]
    B -- Yes --> D[Login /login]
    C --> E[CitizenDashboard /]
    D --> E
    E --> F{What to do?}
    F -- Report issue --> G[NewRequest /nova-solicitacao]
    F -- Track request --> H[CitizenProtocols /meus-protocolos]
    F -- Browse map --> I[CitizenMap /mapa]
    F -- City services --> J[CitizenServices /servicos]
    G --> K[Protocol created → status: Open]
    K --> H
    H --> L[Click protocol]
    L --> M[ProtocolDetails /protocolo/:id]
    M --> N{Status?}
    N -- Open/InProgress --> M
    N -- Resolved/Closed --> O([Journey complete])
```

## Public Protocol

Any protocol can also be tracked without login via `/p/:id` (PublicProtocol page).

## Related

- [[Citizen Domain]]
- [[NewRequest]]
- [[CitizenProtocols]]
- [[Protocol Lifecycle]]
- [[Login Flow]]
- [[Register Flow]]
