package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.api.response.ErrorResponse;
import br.com.fiap.hackgov.application.service.AiPromptService;
import br.com.fiap.hackgov.application.service.AdminAccessService;
import br.com.fiap.hackgov.application.util.AdminRoles;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/ai-prompts")
public class AdminAiPromptsController {
    private final AiPromptService service;
    private final AdminAccessService accessService;

    public AdminAiPromptsController(AiPromptService service, AdminAccessService accessService) {
        this.service = service;
        this.accessService = accessService;
    }

    @GetMapping
    public ResponseEntity<?> list(Authentication authentication) {
        try {
            AuthenticatedUser admin = requireAdmin(authentication);
            accessService.requireScreen(admin.userId(), AdminAccessService.AI);
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse(exception.getMessage()));
        }
        return ResponseEntity.ok(service.list());
    }

    @PutMapping("/{agentKey}")
    public ResponseEntity<?> update(
            @PathVariable String agentKey,
            @RequestBody UpdatePromptRequest request,
            Authentication authentication
    ) {
        AuthenticatedUser admin;
        try {
            admin = requireAdmin(authentication);
            accessService.requireScreen(admin.userId(), AdminAccessService.AI);
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse(exception.getMessage()));
        }
        try {
            return ResponseEntity.ok(service.update(agentKey, request.promptText(), admin.userId()));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(new ErrorResponse(exception.getMessage()));
        }
    }

    private AuthenticatedUser requireAdmin(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)
                || !AdminRoles.isAdministrative(user.role())) {
            throw new IllegalArgumentException("Acesso restrito a administradores.");
        }
        return user;
    }

    record UpdatePromptRequest(String promptText) {
    }
}
