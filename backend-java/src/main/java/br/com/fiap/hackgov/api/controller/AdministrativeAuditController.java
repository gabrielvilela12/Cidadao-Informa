package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.api.response.ErrorResponse;
import br.com.fiap.hackgov.application.dto.admin.DataExportAuditInputDto;
import br.com.fiap.hackgov.application.service.AdminAccessService;
import br.com.fiap.hackgov.application.service.AdministrativeAuditService;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import br.com.fiap.hackgov.infrastructure.security.RoleAccess;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Locale;
import java.util.Set;

@RestController
@RequestMapping("/api/admin/audit")
public class AdministrativeAuditController {

    private static final Set<String> REPORT_RESOURCES = Set.of("DAILY_REPORTS", "DAILY_REPORT_DETAIL");
    private final AdministrativeAuditService auditService;
    private final AdminAccessService accessService;

    public AdministrativeAuditController(
            AdministrativeAuditService auditService,
            AdminAccessService accessService
    ) {
        this.auditService = auditService;
        this.accessService = accessService;
    }

    @PostMapping("/exports")
    public ResponseEntity<?> recordExport(
            @RequestBody DataExportAuditInputDto input,
            Authentication authentication
    ) {
        AuthenticatedUser admin = requireAdmin(authentication);
        if (input == null) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Informe os dados da exportação."));
        }
        try {
            String resourceType = input.resourceType() == null
                    ? ""
                    : input.resourceType().trim().toUpperCase(Locale.ROOT);
            if (REPORT_RESOURCES.contains(resourceType)) {
                accessService.requireScreen(admin.userId(), AdminAccessService.REPORTS);
            } else if ("CITIZENS".equals(resourceType)) {
                accessService.requireScreen(admin.userId(), AdminAccessService.CITIZENS);
            }
            return ResponseEntity.status(HttpStatus.CREATED).body(auditService.recordExport(admin, input));
        } catch (AdminAccessService.AdminAccessDeniedException exception) {
            auditService.recordDenied(admin, "DATA_EXPORT", input.resourceId());
            throw exception;
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(new ErrorResponse(exception.getMessage()));
        }
    }

    @GetMapping("/events")
    public ResponseEntity<?> search(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String actorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication
    ) {
        AuthenticatedUser user = requireAdmin(authentication);
        if (!RoleAccess.isPlatformOwner(user.role())) {
            auditService.recordDenied(user, "ADMINISTRATIVE_AUDIT_TRAIL", null);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse("Somente o gestor da plataforma pode consultar a auditoria administrativa global."));
        }
        try {
            var events = auditService.search(action, actorId, from, to, page, size);
            auditService.recordAuditTrailViewed(user, actorId, action, events.getNumberOfElements());
            return ResponseEntity.ok(events);
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(new ErrorResponse(exception.getMessage()));
        }
    }

    private AuthenticatedUser requireAdmin(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Acesso restrito a administradores."
            );
        }
        if (!RoleAccess.isAdministrative(user.role())) {
            auditService.recordDenied(user, "ADMINISTRATIVE_AUDIT", null);
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Acesso restrito a administradores."
            );
        }
        return user;
    }
}
