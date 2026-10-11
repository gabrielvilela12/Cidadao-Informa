package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.application.dto.protocol.OperationalAnalyticsOutputDto;
import br.com.fiap.hackgov.application.service.OperationalAnalyticsService;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/analytics")
public class OperationalAnalyticsController {
    private final OperationalAnalyticsService service;

    public OperationalAnalyticsController(OperationalAnalyticsService service) { this.service = service; }

    @GetMapping
    public OperationalAnalyticsOutputDto get(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessão inválida ou expirada.");
        }
        return service.get(user, startDate, endDate);
    }
}
