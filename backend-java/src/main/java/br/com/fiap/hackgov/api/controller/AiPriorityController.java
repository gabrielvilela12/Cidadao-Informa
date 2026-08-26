package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.api.response.ErrorResponse;
import br.com.fiap.hackgov.application.service.AiPriorityService;
import br.com.fiap.hackgov.application.service.AdminAccessService;
import br.com.fiap.hackgov.application.service.ServerStatePermissionService;
import br.com.fiap.hackgov.domain.entity.Protocol;
import br.com.fiap.hackgov.domain.repository.ProtocolRepository;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import br.com.fiap.hackgov.infrastructure.security.RoleAccess;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Objects;

@RestController
@RequestMapping("/api/ai-priority")
public class AiPriorityController {

    private final AiPriorityService aiPriorityService;
    private final ProtocolRepository protocolRepository;
    private final ServerStatePermissionService permissionService;
    private final AdminAccessService accessService;

    public AiPriorityController(AiPriorityService aiPriorityService,
                                ProtocolRepository protocolRepository,
                                ServerStatePermissionService permissionService,
                                AdminAccessService accessService) {
        this.aiPriorityService = aiPriorityService;
        this.protocolRepository = protocolRepository;
        this.permissionService = permissionService;
        this.accessService = accessService;
    }

    @GetMapping("/{protocolId}")
    public ResponseEntity<?> getPriority(
            @PathVariable String protocolId,
            Authentication authentication
    ) {
        try {
            AuthenticatedUser user = requireUser(authentication);
            requireProtocolAccess(protocolId, user);
            return ResponseEntity.ok(aiPriorityService.getPriority(protocolId));
        } catch (Exception exception) {
            return ResponseEntity.badRequest().body(new ErrorResponse(exception.getMessage()));
        }
    }

    @PutMapping("/manual/{protocolId}")
    public ResponseEntity<?> setManualPriority(
            @PathVariable String protocolId,
            @RequestBody ManualPriorityRequest request,
            Authentication authentication
    ) {
        try {
            AuthenticatedUser admin = requireAdmin(authentication);
            requireProtocolAccess(protocolId, admin);
            aiPriorityService.updatePriorityManual(
                    protocolId,
                    request.priority(),
                    admin.userId(),
                    request.reason()
            );
            return ResponseEntity.noContent().build();
        } catch (Exception exception) {
            return ResponseEntity.badRequest().body(new ErrorResponse(exception.getMessage()));
        }
    }

    @PostMapping("/regenerate/{protocolId}")
    public ResponseEntity<?> regeneratePriority(
            @PathVariable String protocolId,
            Authentication authentication
    ) {
        try {
            AuthenticatedUser admin = requireAdmin(authentication);
            requireProtocolAccess(protocolId, admin);
            aiPriorityService.regeneratePriority(protocolId);
            return ResponseEntity.noContent().build();
        } catch (Exception exception) {
            return ResponseEntity.badRequest().body(new ErrorResponse(exception.getMessage()));
        }
    }

    @GetMapping("/logs")
    public ResponseEntity<?> getAuditLogs(
            @RequestParam(defaultValue = "7") int days,
            Authentication authentication
    ) {
        try {
            AuthenticatedUser admin = requireAdmin(authentication);
            accessService.requireScreen(admin.userId(), AdminAccessService.AI);
            return ResponseEntity.ok(aiPriorityService.getAuditLogs(
                    days, permissionService.allowedStates(admin.userId())));
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse(exception.getMessage()));
        }
    }

    @GetMapping("/jobs/failed")
    public ResponseEntity<?> getFailedJobs(Authentication authentication) {
        try {
            AuthenticatedUser admin = requireAdmin(authentication);
            accessService.requireScreen(admin.userId(), AdminAccessService.AI);
            return ResponseEntity.ok(aiPriorityService.getFailedJobs(
                    permissionService.allowedStates(admin.userId())));
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse(exception.getMessage()));
        }
    }

    private AuthenticatedUser requireUser(Authentication authentication) {
        if (authentication == null
                || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
            throw new IllegalArgumentException("Sessão inválida ou expirada.");
        }
        return user;
    }

    private AuthenticatedUser requireAdmin(Authentication authentication) {
        AuthenticatedUser user = requireUser(authentication);
        if (!RoleAccess.isAdministrative(user.role())) {
            throw new IllegalArgumentException("Acesso restrito a administradores.");
        }
        return user;
    }

    private void requireProtocolAccess(String protocolId, AuthenticatedUser user) {
        Protocol protocol = protocolRepository.getById(protocolId)
                .orElseThrow(() -> new IllegalArgumentException("Protocolo não encontrado."));
        if (RoleAccess.isPlatformOwner(user.role())) {
            return;
        }
        if (RoleAccess.isAdministrative(user.role())) {
            if (user.establishmentId() != null && !user.establishmentId().isBlank()) {
                if (!Objects.equals(user.establishmentId(), protocol.getEstablishmentId())) {
                    throw new IllegalArgumentException("Você não tem acesso a este protocolo.");
                }
                return;
            }
            permissionService.requireAccess(protocol, user.userId());
        } else if (!protocol.getUserId().equals(user.userId())) {
            throw new IllegalArgumentException("Você não tem acesso a este protocolo.");
        }
    }

    record ManualPriorityRequest(String priority, String reason) {
    }
}
