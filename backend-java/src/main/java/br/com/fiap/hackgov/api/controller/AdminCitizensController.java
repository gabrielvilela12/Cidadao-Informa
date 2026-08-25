package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.application.usecase.admin.GetAdminCitizensUseCase;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import br.com.fiap.hackgov.application.service.ServerStatePermissionService;
import br.com.fiap.hackgov.application.service.AdminAccessService;
import br.com.fiap.hackgov.application.util.AdminRoles;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/citizens")
public class AdminCitizensController {
    private final GetAdminCitizensUseCase useCase;
    private final ServerStatePermissionService permissionService;
    private final AdminAccessService accessService;

    public AdminCitizensController(GetAdminCitizensUseCase useCase,
                                   ServerStatePermissionService permissionService,
                                   AdminAccessService accessService) {
        this.useCase = useCase;
        this.permissionService = permissionService;
        this.accessService = accessService;
    }

    @GetMapping
    public ResponseEntity<?> list(Authentication authentication) {
        AuthenticatedUser admin = requireAdmin(authentication);
        accessService.requireScreen(admin.userId(), AdminAccessService.CITIZENS);
        return ResponseEntity.ok(useCase.list(permissionService.allowedStates(admin.userId())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable String id, Authentication authentication) {
        AuthenticatedUser admin = requireAdmin(authentication);
        accessService.requireScreen(admin.userId(), AdminAccessService.CITIZENS);
        try {
            return ResponseEntity.ok(useCase.detail(id, permissionService.allowedStates(admin.userId())));
        } catch (GetAdminCitizensUseCase.CitizenNotFoundException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, exception.getMessage());
        }
    }

    private AuthenticatedUser requireAdmin(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)
                || !AdminRoles.isAdministrative(user.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso restrito a administradores.");
        }
        return user;
    }
}
