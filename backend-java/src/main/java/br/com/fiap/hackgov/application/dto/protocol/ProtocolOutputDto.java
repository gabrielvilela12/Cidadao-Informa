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
        String establishmentId,
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
        String correctionReport,
        int locationGroupCount,
        boolean locationGrouped,
        boolean locationAlert,
        String primaryProtocolId,
        List<LocationReportOutputDto> locationReports
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
                protocol.getEstablishmentId(),
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
                protocol.getCorrectionReport(),
                1,
                false,
                false,
                protocol.getId(),
                List.of()
        );
    }

    public static ProtocolOutputDto from(
            Protocol protocol,
            int locationGroupCount,
            boolean locationGrouped,
            boolean locationAlert,
            String primaryProtocolId,
            List<LocationReportOutputDto> locationReports
    ) {
        ProtocolOutputDto base = from(protocol);
        return new ProtocolOutputDto(
                base.id(), base.category(), base.description(), base.address(), base.stateCode(),
                base.createdAt(), base.status(), base.resolutionCost(), base.userId(), base.establishmentId(),
                base.requester(), base.phone(), base.aiPriority(), base.aiStatus(), base.latitude(), base.longitude(),
                base.imageUrls(), base.correctedImageUrls(), base.correctionStatus(), base.correctionError(),
                base.correctionGeneratedAt(), base.correctionReport(), locationGroupCount, locationGrouped,
                locationAlert, primaryProtocolId, locationReports == null ? List.of() : List.copyOf(locationReports)
        );
    }
}
