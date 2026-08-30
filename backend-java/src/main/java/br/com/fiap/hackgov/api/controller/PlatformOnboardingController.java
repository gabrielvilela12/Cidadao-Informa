package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.api.response.ErrorResponse;
import br.com.fiap.hackgov.application.dto.onboarding.CreateEstablishmentApplicationInputDto;
import br.com.fiap.hackgov.application.service.PlatformOnboardingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
public class PlatformOnboardingController {

    private final PlatformOnboardingService onboardingService;

    public PlatformOnboardingController(PlatformOnboardingService onboardingService) {
        this.onboardingService = onboardingService;
    }

    @GetMapping("/platform-plans")
    public ResponseEntity<?> plans() {
        try {
            return ResponseEntity.ok(onboardingService.listActivePlans());
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(exception.getMessage()));
        }
    }

    @PostMapping("/establishment-applications")
    public ResponseEntity<?> createApplication(@RequestBody CreateEstablishmentApplicationInputDto input) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(onboardingService.createApplication(input));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(exception.getMessage()));
        }
    }
}
