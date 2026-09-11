package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.api.response.ErrorResponse;
import br.com.fiap.hackgov.application.service.AdminAccessService;
import br.com.fiap.hackgov.application.service.AiChatSettingsService;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import br.com.fiap.hackgov.infrastructure.security.RoleAccess;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/ai-chat-settings")
public class AiChatSettingsController {

    private final AiChatSettingsService settingsService;
    private final AdminAccessService accessService;

    public AiChatSettingsController(AiChatSettingsService settingsService, AdminAccessService accessService) {
        this.settingsService = settingsService;
        this.accessService = accessService;
    }

    @GetMapping
    public ResponseEntity<?> get(Authentication authentication) {
        try {
            AuthenticatedUser user = requireTenantAiManager(authentication);
            return ResponseEntity.ok(settingsService.get(user.establishmentId()));
        } catch (IllegalArgumentException | AdminAccessService.AdminAccessDeniedException exception) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse(exception.getMessage()));
        }
    }

    @PatchMapping
    public ResponseEntity<?> update(
            @RequestBody UpdateAiChatSettingsRequest request,
            Authentication authentication
    ) {
        try {
            if (request == null || request.chatEnabled() == null) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Informe se o chatbot deve ficar ativo."));
            }
            AuthenticatedUser user = requireTenantAiManager(authentication);
            return ResponseEntity.ok(settingsService.update(user.establishmentId(), request.chatEnabled()));
        } catch (IllegalArgumentException | AdminAccessService.AdminAccessDeniedException exception) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse(exception.getMessage()));
        }
    }

    private AuthenticatedUser requireTenantAiManager(Authentication authentication) {
        if (authentication == null
                || !(authentication.getPrincipal() instanceof AuthenticatedUser user)
                || user.establishmentId() == null
                || user.establishmentId().isBlank()) {
            throw new IllegalArgumentException("Acesso restrito a usuarios vinculados a prefeitura.");
        }

        String role = RoleAccess.normalize(user.role());
        if (RoleAccess.ESTABLISHMENT_OWNER.equals(role)) {
            return user;
        }
        if (RoleAccess.ADMIN.equals(role)) {
            accessService.requireScreen(user.userId(), AdminAccessService.AI);
            return user;
        }
        throw new IllegalArgumentException("Acesso restrito ao dono ou servidor autorizado da prefeitura.");
    }

    public record UpdateAiChatSettingsRequest(Boolean chatEnabled) {
    }
}
