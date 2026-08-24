package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.application.service.DailyOperationalReportService;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/reports")
public class AdminReportsController {
    private final DailyOperationalReportService service;

    public AdminReportsController(DailyOperationalReportService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<?> list(Authentication authentication) {
        requireAdmin(authentication);
        return ResponseEntity.ok(service.list());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable UUID id, Authentication authentication) {
        requireAdmin(authentication);
        return ResponseEntity.ok(service.detail(id));
    }

    private void requireAdmin(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)
                || !"admin".equalsIgnoreCase(user.role())) {
            throw new IllegalArgumentException("Acesso restrito a administradores.");
        }
    }
}
