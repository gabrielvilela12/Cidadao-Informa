package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.api.response.ErrorResponse;
import br.com.fiap.hackgov.application.service.AiBillingService;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import br.com.fiap.hackgov.infrastructure.security.RoleAccess;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/ai-billing")
public class AiBillingController {

    private final AiBillingService billingService;

    public AiBillingController(AiBillingService billingService) {
        this.billingService = billingService;
    }

    @GetMapping
    public ResponseEntity<?> dashboard(Authentication authentication) {
        try {
            AuthenticatedUser owner = requireEstablishmentOwner(authentication);
            return ResponseEntity.ok(billingService.getDashboard(owner.establishmentId()));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse(exception.getMessage()));
        }
    }

    @PostMapping("/top-ups")
    public ResponseEntity<?> requestTopUp(
            @RequestBody TopUpRequest request,
            Authentication authentication
    ) {
        try {
            AuthenticatedUser owner = requireEstablishmentOwner(authentication);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(billingService.requestTopUp(owner.establishmentId(), request.amountBrl()));
        } catch (IllegalArgumentException exception) {
            HttpStatus status = exception.getMessage().startsWith("Acesso restrito")
                    ? HttpStatus.FORBIDDEN
                    : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status).body(new ErrorResponse(exception.getMessage()));
        }
    }

    private AuthenticatedUser requireEstablishmentOwner(Authentication authentication) {
        if (authentication == null
                || !(authentication.getPrincipal() instanceof AuthenticatedUser user)
                || !RoleAccess.ESTABLISHMENT_OWNER.equals(RoleAccess.normalize(user.role()))
                || user.establishmentId() == null
                || user.establishmentId().isBlank()) {
            throw new IllegalArgumentException("Acesso restrito ao dono do assinante.");
        }
        return user;
    }

    public record TopUpRequest(BigDecimal amountBrl) {}
}
