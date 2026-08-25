package br.com.fiap.hackgov.application.dto.admin;

import br.com.fiap.hackgov.domain.entity.Protocol;
import br.com.fiap.hackgov.domain.entity.User;

import java.time.Instant;
import java.util.List;

public record AdminCitizenSummaryOutputDto(
        String id,
        String name,
        String email,
        String cpf,
        String phone,
        Instant createdAt,
        int protocolCount,
        int openProtocolCount,
        Instant lastProtocolAt
) {
    public static AdminCitizenSummaryOutputDto from(User citizen, List<Protocol> protocols) {
        int openCount = (int) protocols.stream()
                .filter(protocol -> !isResolved(protocol.getStatus()))
                .count();
        Instant lastProtocolAt = protocols.stream()
                .map(Protocol::getCreatedAt)
                .filter(date -> date != null)
                .max(Instant::compareTo)
                .orElse(null);

        return from(citizen, protocols.size(), openCount, lastProtocolAt);
    }

    public static AdminCitizenSummaryOutputDto from(
            User citizen,
            long protocolCount,
            long openProtocolCount,
            Instant lastProtocolAt
    ) {
        return new AdminCitizenSummaryOutputDto(
                citizen.getId(),
                citizen.getName(),
                citizen.getEmail(),
                citizen.getCpf(),
                citizen.getPhone(),
                citizen.getCreatedAt(),
                Math.toIntExact(protocolCount),
                Math.toIntExact(openProtocolCount),
                lastProtocolAt
        );
    }

    private static boolean isResolved(String status) {
        return status != null && List.of("Concluido", "Concluído", "Resolved", "Closed")
                .stream()
                .anyMatch(item -> item.equalsIgnoreCase(status));
    }
}
