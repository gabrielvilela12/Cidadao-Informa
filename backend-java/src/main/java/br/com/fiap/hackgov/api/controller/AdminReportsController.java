package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.application.service.DailyOperationalReportService;
import br.com.fiap.hackgov.application.service.AdminAccessService;
import br.com.fiap.hackgov.application.service.ServerStatePermissionService;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import br.com.fiap.hackgov.application.util.AdminRoles;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/reports")
public class AdminReportsController {
    private final DailyOperationalReportService service;
    private final ServerStatePermissionService permissionService;
    private final AdminAccessService accessService;

    public AdminReportsController(DailyOperationalReportService service,
                                  ServerStatePermissionService permissionService,
                                  AdminAccessService accessService) {
        this.service = service;
        this.permissionService = permissionService;
        this.accessService = accessService;
    }

    @GetMapping
    public ResponseEntity<?> list(Authentication authentication) {
        AuthenticatedUser admin = requireAdmin(authentication);
        accessService.requireScreen(admin.userId(), AdminAccessService.REPORTS);
        return ResponseEntity.ok(service.list(permissionService.allowedStates(admin.userId())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable UUID id, Authentication authentication) {
        AuthenticatedUser admin = requireAdmin(authentication);
        accessService.requireScreen(admin.userId(), AdminAccessService.REPORTS);
        return ResponseEntity.ok(service.detail(id, permissionService.allowedStates(admin.userId())));
    }

    private AuthenticatedUser requireAdmin(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)
                || !AdminRoles.isAdministrative(user.role())) {
            throw new IllegalArgumentException("Acesso restrito a administradores.");
        }
        return user;
    }
}
