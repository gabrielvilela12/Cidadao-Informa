package br.com.fiap.hackgov.application.dto.admin;

import br.com.fiap.hackgov.domain.audit.AdministrativeAuditEvent;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record AdministrativeAuditEventOutputDto(
        UUID id,
        String actorId,
        String actorRole,
        String action,
        String resourceType,
        String resourceIdHash,
        String result,
        String establishmentId,
        Map<String, Object> metadata,
        Instant createdAt
) {
    public static AdministrativeAuditEventOutputDto from(AdministrativeAuditEvent event) {
        return new AdministrativeAuditEventOutputDto(
                event.getId(), event.getActorId(), event.getActorRole(), event.getAction(),
                event.getResourceType(), event.getResourceIdHash(), event.getResult(),
                event.getEstablishmentId(), event.getMetadata(), event.getCreatedAt()
        );
    }
}
