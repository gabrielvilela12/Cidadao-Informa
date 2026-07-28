package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.api.response.ErrorResponse;
import br.com.fiap.hackgov.application.service.AiPriorityService;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
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

@RestController
@RequestMapping("/api/ai-priority")
public class AiPriorityController {

    private final AiPriorityService aiPriorityService;

    public AiPriorityController(AiPriorityService aiPriorityService) {
        this.aiPriorityService = aiPriorityService;
    }

    @GetMapping("/{protocolId}")
    public ResponseEntity<?> getPriority(
            @PathVariable String protocolId,
            Authentication authentication
    ) {
        try {
            requireUser(authentication);
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
            requireAdmin(authentication);
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
            requireAdmin(authentication);
            return ResponseEntity.ok(aiPriorityService.getAuditLogs(days));
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse(exception.getMessage()));
        }
    }

    @GetMapping("/jobs/failed")
    public ResponseEntity<?> getFailedJobs(Authentication authentication) {
        try {
            requireAdmin(authentication);
            return ResponseEntity.ok(aiPriorityService.getFailedJobs());
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
        if (!"admin".equalsIgnoreCase(user.role())) {
            throw new IllegalArgumentException("Acesso restrito a administradores.");
        }
        return user;
    }

    record ManualPriorityRequest(String priority, String reason) {
    }
}
