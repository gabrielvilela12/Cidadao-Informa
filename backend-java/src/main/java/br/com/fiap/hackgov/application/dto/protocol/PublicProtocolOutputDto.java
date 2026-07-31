package br.com.fiap.hackgov.application.dto.protocol;

import br.com.fiap.hackgov.domain.entity.Protocol;

import java.time.Instant;

public record PublicProtocolOutputDto(
        String id,
        String category,
        String description,
        String address,
        Instant createdAt,
        String status,
        String aiPriority,
        String aiStatus,
        Double latitude,
        Double longitude
) {
    public static PublicProtocolOutputDto from(Protocol protocol) {
        return new PublicProtocolOutputDto(
                protocol.getId(),
                protocol.getCategory(),
                protocol.getDescription(),
                protocol.getAddress(),
                protocol.getCreatedAt(),
                protocol.getStatus(),
                protocol.getAiPriority(),
                protocol.getAiStatus(),
                protocol.getLatitude(),
                protocol.getLongitude()
        );
    }
}
