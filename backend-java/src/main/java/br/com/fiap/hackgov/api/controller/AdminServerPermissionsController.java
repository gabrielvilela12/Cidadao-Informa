package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.api.response.ErrorResponse;
import br.com.fiap.hackgov.application.service.ServerStatePermissionService;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/server-permissions")
public class AdminServerPermissionsController {
    private final ServerStatePermissionService service;

    public AdminServerPermissionsController(ServerStatePermissionService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<?> list(Authentication authentication) {
        if (!isAdmin(authentication)) return forbidden();
        return ResponseEntity.ok(service.listServers());
    }

    @PutMapping("/{userId}")
    public ResponseEntity<?> update(@PathVariable String userId,
                                    @RequestBody UpdatePermissionsRequest request,
                                    Authentication authentication) {
        if (!isAdmin(authentication)) return forbidden();
        try {
            return ResponseEntity.ok(service.update(userId, request.states()));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(new ErrorResponse(exception.getMessage()));
        }
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication != null
                && authentication.getPrincipal() instanceof AuthenticatedUser user
                && "admin".equalsIgnoreCase(user.role());
    }

    private ResponseEntity<ErrorResponse> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponse("Acesso restrito a administradores."));
    }

    public record UpdatePermissionsRequest(List<String> states) { }
}
