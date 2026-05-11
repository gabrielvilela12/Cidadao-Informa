---
tags: [domain/citizen, layer/frontend, type/page]
aliases: [Meus Protocolos, My Protocols, /meus-protocolos]
---

# CitizenProtocols

> List of protocols opened by the logged-in citizen.

## Route

`/meus-protocolos`

## Data

Calls `api.getProtocols(userId)` with the citizen's `userId` to return only their protocols.

## Code Reference

`src/pages/CitizenProtocols.tsx`

## Related

- [[Citizen Domain]]
- [[Protocol Lifecycle]]
- [[ProtocolDetails]]
- [[GetProtocolsUseCase]]
