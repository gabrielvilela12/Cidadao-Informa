package br.com.fiap.hackgov.application.dto.protocol;

import br.com.fiap.hackgov.domain.entity.Protocol;

import java.time.Instant;

public record ProtocolOutputDto(
        String id,
        String category,
        String description,
        String address,
        Instant createdAt,
        String status,
        String userId,
        String requester,
        String phone,
        String aiPriority,
        String aiStatus,
        Double latitude,
        Double longitude
) {
    public static ProtocolOutputDto from(Protocol protocol) {
        return new ProtocolOutputDto(
                protocol.getId(),
                protocol.getCategory(),
                protocol.getDescription(),
                protocol.getAddress(),
                protocol.getCreatedAt(),
                protocol.getStatus(),
                protocol.getUserId(),
                protocol.getRequester(),
                protocol.getUser() != null ? protocol.getUser().getPhone() : null,
                protocol.getAiPriority(),
                protocol.getAiStatus(),
                protocol.getLatitude(),
                protocol.getLongitude()
        );
    }
}
