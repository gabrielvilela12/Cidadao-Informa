package br.com.fiap.hackgov.application.dto.protocol;

import br.com.fiap.hackgov.domain.entity.Protocol;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record ProtocolOutputDto(
        String id,
        String category,
        String description,
        String address,
        String stateCode,
        Instant createdAt,
        String status,
        BigDecimal resolutionCost,
        String userId,
        String requester,
        String phone,
        String aiPriority,
        String aiStatus,
        Double latitude,
        Double longitude,
        List<String> imageUrls,
        List<String> correctedImageUrls,
        String correctionStatus,
        String correctionError,
        Instant correctionGeneratedAt,
        String correctionReport
) {
    public static ProtocolOutputDto from(Protocol protocol) {
        return new ProtocolOutputDto(
                protocol.getId(),
                protocol.getCategory(),
                protocol.getDescription(),
                protocol.getAddress(),
                protocol.getStateCode(),
                protocol.getCreatedAt(),
                protocol.getStatus(),
                protocol.getResolutionCost(),
                protocol.getUserId(),
                protocol.getRequester(),
                protocol.getUser() != null ? protocol.getUser().getPhone() : null,
                protocol.getAiPriority(),
                protocol.getAiStatus(),
                protocol.getLatitude(),
                protocol.getLongitude(),
                protocol.getImageUrls(),
                protocol.getCorrectedImageUrls(),
                protocol.getCorrectionStatus(),
                protocol.getCorrectionError(),
                protocol.getCorrectionGeneratedAt(),
                protocol.getCorrectionReport()
        );
    }
}
