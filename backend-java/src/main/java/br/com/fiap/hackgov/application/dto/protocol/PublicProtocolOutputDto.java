package br.com.fiap.hackgov.application.dto.protocol;

import br.com.fiap.hackgov.domain.entity.Protocol;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record PublicProtocolOutputDto(
        String id,
        String category,
        String description,
        String address,
        Instant createdAt,
        String status,
        BigDecimal resolutionCost,
        String aiPriority,
        String aiStatus,
        Double latitude,
        Double longitude,
        List<String> imageUrls
) {
    public static PublicProtocolOutputDto from(Protocol protocol) {
        return new PublicProtocolOutputDto(
                protocol.getId(),
                protocol.getCategory(),
                protocol.getDescription(),
                protocol.getAddress(),
                protocol.getCreatedAt(),
                protocol.getStatus(),
                protocol.getResolutionCost(),
                protocol.getAiPriority(),
                protocol.getAiStatus(),
                protocol.getLatitude(),
                protocol.getLongitude(),
                protocol.getImageUrls()
        );
    }
}
