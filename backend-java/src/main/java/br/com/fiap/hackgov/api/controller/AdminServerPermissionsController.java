package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.api.response.ErrorResponse;
import br.com.fiap.hackgov.application.service.AdminAccessService;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/server-permissions")
public class AdminServerPermissionsController {
    private final AdminAccessService service;

    public AdminServerPermissionsController(AdminAccessService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<?> list(Authentication authentication) {
        AuthenticatedUser admin = admin(authentication);
        if (admin == null) return forbidden();
        try {
            return ResponseEntity.ok(service.listManageable(admin.userId()));
        } catch (AdminAccessService.AdminAccessDeniedException exception) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse(exception.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateAdminRequest request,
                                    Authentication authentication) {
        AuthenticatedUser admin = admin(authentication);
        if (admin == null) return forbidden();
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(service.create(
                    admin.userId(), request.name(), request.email(), request.cpf(), request.password(),
                    request.states(), request.screens()
            ));
        } catch (AdminAccessService.AdminAccessDeniedException exception) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse(exception.getMessage()));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(new ErrorResponse(exception.getMessage()));
        }
    }

    @PutMapping("/{userId}")
    public ResponseEntity<?> update(@PathVariable String userId,
                                    @RequestBody UpdatePermissionsRequest request,
                                    Authentication authentication) {
        AuthenticatedUser admin = admin(authentication);
        if (admin == null) return forbidden();
        try {
            return ResponseEntity.ok(service.update(admin.userId(), userId, request.states(), request.screens()));
        } catch (AdminAccessService.AdminAccessDeniedException exception) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse(exception.getMessage()));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(new ErrorResponse(exception.getMessage()));
        }
    }

    private AuthenticatedUser admin(Authentication authentication) {
        if (authentication != null
                && authentication.getPrincipal() instanceof AuthenticatedUser user
                && "admin".equalsIgnoreCase(user.role())) return user;
        return null;
    }

    private ResponseEntity<ErrorResponse> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponse("Acesso restrito a administradores."));
    }

    public record UpdatePermissionsRequest(List<String> states, List<String> screens) { }

    public record CreateAdminRequest(
            String name,
            String email,
            String cpf,
            String password,
            List<String> states,
            List<String> screens
    ) { }
}
