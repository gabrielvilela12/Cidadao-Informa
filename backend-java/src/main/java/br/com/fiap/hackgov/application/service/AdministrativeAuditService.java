package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.application.dto.admin.AdministrativeAuditEventOutputDto;
import br.com.fiap.hackgov.application.dto.admin.DataExportAuditInputDto;
import br.com.fiap.hackgov.domain.audit.AdministrativeAuditEvent;
import br.com.fiap.hackgov.infrastructure.repository.AdministrativeAuditRepository;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import br.com.fiap.hackgov.infrastructure.security.RoleAccess;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class AdministrativeAuditService {

    public static final String CITIZEN_LIST_VIEWED = "SENSITIVE_CITIZEN_LIST_VIEWED";
    public static final String CITIZEN_VIEWED = "SENSITIVE_CITIZEN_VIEWED";
    public static final String SENSITIVE_ACCESS_DENIED = "SENSITIVE_ACCESS_DENIED";
    public static final String DATA_EXPORTED = "DATA_EXPORTED";
    public static final String AUDIT_TRAIL_VIEWED = "ADMINISTRATIVE_AUDIT_TRAIL_VIEWED";

    private static final Set<String> EXPORT_RESOURCES = Set.of(
            "PROTOCOLS_DASHBOARD", "PROTOCOLS_QUEUE", "PROTOCOLS_MAP",
            "DAILY_REPORTS", "DAILY_REPORT_DETAIL", "CITIZENS"
    );
    private static final Set<String> EXPORT_FORMATS = Set.of("CSV", "XLSX", "PDF");

    private final AdministrativeAuditRepository repository;

    public AdministrativeAuditService(AdministrativeAuditRepository repository) {
        this.repository = repository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AdministrativeAuditEventOutputDto recordCitizenListViewed(AuthenticatedUser actor, int recordCount) {
        return append(actor, CITIZEN_LIST_VIEWED, "CITIZEN_LIST", null, "SUCCESS", Map.of(
                "record_count", Math.max(0, recordCount),
                "purpose", "administrative_service"
        ));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AdministrativeAuditEventOutputDto recordCitizenViewed(
            AuthenticatedUser actor,
            String citizenId,
            int protocolCount
    ) {
        return append(actor, CITIZEN_VIEWED, "CITIZEN", citizenId, "SUCCESS", Map.of(
                "protocol_count", Math.max(0, protocolCount),
                "purpose", "administrative_service"
        ));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AdministrativeAuditEventOutputDto recordDenied(
            AuthenticatedUser actor,
            String resourceType,
            String resourceId
    ) {
        return append(actor, SENSITIVE_ACCESS_DENIED, normalized(resourceType), resourceId, "DENIED", Map.of());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AdministrativeAuditEventOutputDto recordAuditTrailViewed(
            AuthenticatedUser actor,
            String actorIdFilter,
            String actionFilter,
            int returnedCount
    ) {
        return append(actor, AUDIT_TRAIL_VIEWED, "ADMINISTRATIVE_AUDIT_TRAIL", actorIdFilter, "SUCCESS", Map.of(
                "action_filter", normalized(actionFilter),
                "returned_count", Math.max(0, returnedCount),
                "purpose", "governance_investigation"
        ));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AdministrativeAuditEventOutputDto recordExport(
            AuthenticatedUser actor,
            DataExportAuditInputDto input
    ) {
        if (input == null) throw new IllegalArgumentException("Informe os dados da exportação.");
        String resourceType = normalized(input.resourceType());
        String format = normalized(input.format());
        if (!EXPORT_RESOURCES.contains(resourceType)) {
            throw new IllegalArgumentException("Tipo de recurso inválido para auditoria de exportação.");
        }
        if (!EXPORT_FORMATS.contains(format)) {
            throw new IllegalArgumentException("Formato de exportação inválido.");
        }
        if (input.recordCount() < 1 || input.recordCount() > 1_000_000) {
            throw new IllegalArgumentException("A quantidade exportada deve estar entre 1 e 1000000 registros.");
        }
        return append(actor, DATA_EXPORTED, resourceType, input.resourceId(), "SUCCESS", Map.of(
                "format", format,
                "record_count", input.recordCount(),
                "purpose", "analysis_and_accountability"
        ));
    }

    @Transactional(readOnly = true)
    public Page<AdministrativeAuditEventOutputDto> search(
            String action,
            String actorId,
            Instant from,
            Instant to,
            int page,
            int size
    ) {
        if (page < 0) throw new IllegalArgumentException("A página não pode ser negativa.");
        if (size < 1 || size > 100) throw new IllegalArgumentException("O tamanho da página deve ficar entre 1 e 100.");
        if (from != null && to != null && !from.isBefore(to)) {
            throw new IllegalArgumentException("O início do período deve ser anterior ao fim.");
        }
        return repository.search(blankToNull(normalized(action)), blankToNull(actorId), from, to, PageRequest.of(page, size))
                .map(AdministrativeAuditEventOutputDto::from);
    }

    private AdministrativeAuditEventOutputDto append(
            AuthenticatedUser actor,
            String action,
            String resourceType,
            String resourceId,
            String result,
            Map<String, Object> metadata
    ) {
        if (actor == null || actor.userId() == null || actor.userId().isBlank()) {
            throw new IllegalArgumentException("Ator autenticado é obrigatório para a auditoria.");
        }
        AdministrativeAuditEvent event = new AdministrativeAuditEvent();
        event.setActorId(actor.userId());
        event.setActorRole(RoleAccess.normalize(actor.role()));
        event.setAction(action);
        event.setResourceType(resourceType);
        event.setResourceIdHash(hashNullable(resourceId));
        event.setResult(result);
        event.setEstablishmentId(blankToNull(actor.establishmentId()));
        event.setMetadata(metadata);
        event.setCreatedAt(Instant.now());
        return AdministrativeAuditEventOutputDto.from(repository.save(event));
    }

    private String hashNullable(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.trim().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception exception) {
            throw new IllegalStateException("Não foi possível proteger o identificador auditado.", exception);
        }
    }

    private String normalized(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
