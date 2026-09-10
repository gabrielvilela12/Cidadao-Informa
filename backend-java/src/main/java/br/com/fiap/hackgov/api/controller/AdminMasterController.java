package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.api.response.ErrorResponse;
import br.com.fiap.hackgov.application.dto.adminmaster.EstablishmentDetailsOutputDto;
import br.com.fiap.hackgov.application.dto.onboarding.ReviewEstablishmentApplicationInputDto;
import br.com.fiap.hackgov.application.service.AiBillingService;
import br.com.fiap.hackgov.application.service.PlatformOnboardingService;
import br.com.fiap.hackgov.application.service.PlatformOverviewService;
import br.com.fiap.hackgov.application.usecase.protocol.GetProtocolsUseCase;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import br.com.fiap.hackgov.infrastructure.security.RoleAccess;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/admin-master")
public class AdminMasterController {

    private final PlatformOverviewService platformOverviewService;
    private final PlatformOnboardingService onboardingService;
    private final GetProtocolsUseCase getProtocolsUseCase;
    private final AiBillingService aiBillingService;

    public AdminMasterController(
            PlatformOverviewService platformOverviewService,
            PlatformOnboardingService onboardingService,
            GetProtocolsUseCase getProtocolsUseCase,
            AiBillingService aiBillingService
    ) {
        this.platformOverviewService = platformOverviewService;
        this.onboardingService = onboardingService;
        this.getProtocolsUseCase = getProtocolsUseCase;
        this.aiBillingService = aiBillingService;
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

    @GetMapping("/establishments/{establishmentId}")
    public ResponseEntity<?> establishmentDetails(
            @PathVariable String establishmentId,
            Authentication authentication
    ) {
        try {
            requirePlatformOwner(authentication);
            return ResponseEntity.ok(new EstablishmentDetailsOutputDto(
                    platformOverviewService.getEstablishmentSubscription(establishmentId),
                    getProtocolsUseCase.executeForAdminByEstablishment(establishmentId),
                    platformOverviewService.getEstablishmentPayments(establishmentId)
            ));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse(exception.getMessage()));
        }
    }

    @PostMapping("/applications/{applicationId}/approve")
    public ResponseEntity<?> approveApplication(
            @PathVariable String applicationId,
            Authentication authentication
    ) {
        try {
            AuthenticatedUser user = requirePlatformOwner(authentication);
            onboardingService.approve(applicationId, user.userId());
            return ResponseEntity.ok(platformOverviewService.getOverview());
        } catch (IllegalArgumentException exception) {
            HttpStatus status = "Acesso restrito aos donos da plataforma.".equals(exception.getMessage())
                    ? HttpStatus.FORBIDDEN
                    : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status)
                    .body(new ErrorResponse(exception.getMessage()));
        }
    }

    @PostMapping("/applications/{applicationId}/reject")
    public ResponseEntity<?> rejectApplication(
            @PathVariable String applicationId,
            @RequestBody(required = false) ReviewEstablishmentApplicationInputDto input,
            Authentication authentication
    ) {
        try {
            AuthenticatedUser user = requirePlatformOwner(authentication);
            onboardingService.reject(applicationId, user.userId(), input);
            return ResponseEntity.ok(platformOverviewService.getOverview());
        } catch (IllegalArgumentException exception) {
            HttpStatus status = "Acesso restrito aos donos da plataforma.".equals(exception.getMessage())
                    ? HttpStatus.FORBIDDEN
                    : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status)
                    .body(new ErrorResponse(exception.getMessage()));
        }
    }

    @GetMapping("/establishments/{establishmentId}/ai-billing")
    public ResponseEntity<?> establishmentAiBilling(
            @PathVariable String establishmentId,
            Authentication authentication
    ) {
        try {
            requirePlatformOwner(authentication);
            return ResponseEntity.ok(aiBillingService.getDashboard(establishmentId));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(exception.getMessage()));
        }
    }

    @PostMapping("/establishments/{establishmentId}/ai-billing/credits")
    public ResponseEntity<?> addAiCredit(
            @PathVariable String establishmentId,
            @RequestBody AiCreditRequest request,
            Authentication authentication
    ) {
        try {
            AuthenticatedUser owner = requirePlatformOwner(authentication);
            return ResponseEntity.ok(aiBillingService.addCredit(
                    establishmentId,
                    request.amountBrl(),
                    request.description(),
                    owner.userId()
            ));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(exception.getMessage()));
        }
    }

    @PostMapping("/ai-billing/top-ups/{paymentId}/confirm")
    public ResponseEntity<?> confirmAiTopUp(
            @PathVariable String paymentId,
            Authentication authentication
    ) {
        try {
            AuthenticatedUser owner = requirePlatformOwner(authentication);
            return ResponseEntity.ok(aiBillingService.confirmTopUp(paymentId, owner.userId()));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(exception.getMessage()));
        }
    }

    private AuthenticatedUser requirePlatformOwner(Authentication authentication) {
        if (authentication == null
                || !(authentication.getPrincipal() instanceof AuthenticatedUser user)
                || !RoleAccess.isPlatformOwner(user.role())) {
            throw new IllegalArgumentException("Acesso restrito aos donos da plataforma.");
        }
        return user;
    }

    public record AiCreditRequest(BigDecimal amountBrl, String description) {}
}
