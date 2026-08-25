package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.application.service.DailyOperationalReportService;
import br.com.fiap.hackgov.application.service.ServerStatePermissionService;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/reports")
public class AdminReportsController {
    private final DailyOperationalReportService service;
    private final ServerStatePermissionService permissionService;

    public AdminReportsController(DailyOperationalReportService service,
                                  ServerStatePermissionService permissionService) {
        this.service = service;
        this.permissionService = permissionService;
    }

    @GetMapping
    public ResponseEntity<?> list(Authentication authentication) {
        AuthenticatedUser admin = requireAdmin(authentication);
        return ResponseEntity.ok(service.list(permissionService.allowedStates(admin.userId())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable UUID id, Authentication authentication) {
        AuthenticatedUser admin = requireAdmin(authentication);
        return ResponseEntity.ok(service.detail(id, permissionService.allowedStates(admin.userId())));
    }

    private AuthenticatedUser requireAdmin(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)
                || !"admin".equalsIgnoreCase(user.role())) {
            throw new IllegalArgumentException("Acesso restrito a administradores.");
        }
        return user;
    }
}
