package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.api.response.ErrorResponse;
import br.com.fiap.hackgov.application.dto.adminmaster.CreateSubscriptionInputDto;
import br.com.fiap.hackgov.application.service.PlatformOverviewService;
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

@RestController
@RequestMapping("/api/admin-master")
public class AdminMasterController {

    private final PlatformOverviewService platformOverviewService;

    public AdminMasterController(PlatformOverviewService platformOverviewService) {
        this.platformOverviewService = platformOverviewService;
    }

    @GetMapping("/overview")
    public ResponseEntity<?> overview(Authentication authentication) {
        try {
            requirePlatformOwner(authentication);
            return ResponseEntity.ok(platformOverviewService.getOverview());
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse(exception.getMessage()));
        }
    }

    @PostMapping("/subscriptions")
    public ResponseEntity<?> createSubscription(
            @RequestBody CreateSubscriptionInputDto input,
            Authentication authentication
    ) {
        try {
            requirePlatformOwner(authentication);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(platformOverviewService.createSubscription(input));
        } catch (IllegalArgumentException exception) {
            HttpStatus status = "Acesso restrito aos donos da plataforma.".equals(exception.getMessage())
                    ? HttpStatus.FORBIDDEN
                    : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status)
                    .body(new ErrorResponse(exception.getMessage()));
        }
    }

    private void requirePlatformOwner(Authentication authentication) {
        if (authentication == null
                || !(authentication.getPrincipal() instanceof AuthenticatedUser user)
                || !RoleAccess.isPlatformOwner(user.role())) {
            throw new IllegalArgumentException("Acesso restrito aos donos da plataforma.");
        }
    }
}
