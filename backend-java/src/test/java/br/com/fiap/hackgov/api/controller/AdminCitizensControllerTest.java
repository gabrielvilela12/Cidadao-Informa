package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.application.usecase.admin.GetAdminCitizensUseCase;
import br.com.fiap.hackgov.application.service.ServerStatePermissionService;
import br.com.fiap.hackgov.application.service.AdminAccessService;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminCitizensControllerTest {
    @Test
    void allowsAdminToListCitizens() {
        GetAdminCitizensUseCase useCase = mock(GetAdminCitizensUseCase.class);
        ServerStatePermissionService permissions = mock(ServerStatePermissionService.class);
        when(permissions.allowedStates("user-id")).thenReturn(Set.of("SP"));
        when(useCase.list(Set.of("SP"))).thenReturn(List.of());
        AdminAccessService access = mock(AdminAccessService.class);
        AdminCitizensController controller = new AdminCitizensController(useCase, permissions, access);

        assertEquals(HttpStatus.OK, controller.list(authentication("admin")).getStatusCode());
        verify(useCase).list(Set.of("SP"));
        verify(access).requireScreen("user-id", AdminAccessService.CITIZENS);
    }

    @Test
    void blocksCitizenFromAdminCitizenData() {
        AdminCitizensController controller = new AdminCitizensController(
                mock(GetAdminCitizensUseCase.class), mock(ServerStatePermissionService.class),
                mock(AdminAccessService.class));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> controller.list(authentication("citizen"))
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
    }

    private Authentication authentication(String role) {
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(
                new AuthenticatedUser("user-id", "Usuário", "12345678901", role)
        );
        return authentication;
    }
}
