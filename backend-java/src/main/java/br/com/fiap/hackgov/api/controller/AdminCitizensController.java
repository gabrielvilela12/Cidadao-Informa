package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.application.usecase.admin.GetAdminCitizensUseCase;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import br.com.fiap.hackgov.application.service.ServerStatePermissionService;
import br.com.fiap.hackgov.application.service.AdminAccessService;
import br.com.fiap.hackgov.application.service.AdministrativeAuditService;
import br.com.fiap.hackgov.application.dto.admin.AdminCitizenDetailOutputDto;
import br.com.fiap.hackgov.application.dto.admin.AdminCitizenSummaryOutputDto;
import br.com.fiap.hackgov.application.util.AdminRoles;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/admin/citizens")
public class AdminCitizensController {
    private final GetAdminCitizensUseCase useCase;
    private final ServerStatePermissionService permissionService;
    private final AdminAccessService accessService;
    private final AdministrativeAuditService auditService;

    public AdminCitizensController(GetAdminCitizensUseCase useCase,
                                   ServerStatePermissionService permissionService,
                                   AdminAccessService accessService,
                                   AdministrativeAuditService auditService) {
        this.useCase = useCase;
        this.permissionService = permissionService;
        this.accessService = accessService;
        this.auditService = auditService;
    }

    @GetMapping
    public ResponseEntity<?> list(Authentication authentication) {
        AuthenticatedUser admin = requireAdmin(authentication);
        try {
            accessService.requireScreen(admin.userId(), AdminAccessService.CITIZENS);
        } catch (AdminAccessService.AdminAccessDeniedException exception) {
            auditService.recordDenied(admin, "CITIZEN_LIST", null);
            throw exception;
        }
        List<AdminCitizenSummaryOutputDto> citizens = useCase.list(
                permissionService.allowedStates(admin.userId()),
                admin.establishmentId()
        );
        auditService.recordCitizenListViewed(admin, citizens.size());
        return ResponseEntity.ok(citizens);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable String id, Authentication authentication) {
        AuthenticatedUser admin = requireAdmin(authentication);
        try {
            accessService.requireScreen(admin.userId(), AdminAccessService.CITIZENS);
        } catch (AdminAccessService.AdminAccessDeniedException exception) {
            auditService.recordDenied(admin, "CITIZEN", id);
            throw exception;
        }
        try {
            AdminCitizenDetailOutputDto citizen = useCase.detail(
                    id,
                    permissionService.allowedStates(admin.userId()),
                    admin.establishmentId()
            );
            auditService.recordCitizenViewed(admin, id, citizen.protocolCount());
            return ResponseEntity.ok(citizen);
        } catch (GetAdminCitizensUseCase.CitizenNotFoundException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, exception.getMessage());
        }
    }

    private AuthenticatedUser requireAdmin(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso restrito a administradores.");
        }
        if (!AdminRoles.isAdministrative(user.role())) {
            auditService.recordDenied(user, "CITIZEN_ADMIN", null);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso restrito a administradores.");
        }
        return user;
    }
}
