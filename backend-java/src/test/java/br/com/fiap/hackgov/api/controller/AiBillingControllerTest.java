package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.application.service.AdminAccessService;
import br.com.fiap.hackgov.application.service.AiBillingService;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiBillingControllerTest {

    @Test
    void allowsEstablishmentOwnerToViewDashboard() {
        AiBillingService billing = mock(AiBillingService.class);
        AdminAccessService access = mock(AdminAccessService.class);
        AiBillingController controller = new AiBillingController(billing, access);

        assertEquals(HttpStatus.OK, controller.dashboard(authentication("establishment_owner")).getStatusCode());
        verify(billing).getDashboard("est-1");
    }

    @Test
    void allowsServerWithAiPermissionToViewDashboard() {
        AiBillingService billing = mock(AiBillingService.class);
        AdminAccessService access = mock(AdminAccessService.class);
        AiBillingController controller = new AiBillingController(billing, access);

        assertEquals(HttpStatus.OK, controller.dashboard(authentication("admin")).getStatusCode());
        verify(access).requireScreen("user-id", AdminAccessService.AI);
        verify(billing).getDashboard("est-1");
    }

    @Test
    void blocksServerWithoutAiPermission() {
        AiBillingService billing = mock(AiBillingService.class);
        AdminAccessService access = mock(AdminAccessService.class);
        doThrow(new IllegalArgumentException("Sem permissão"))
                .when(access).requireScreen("user-id", AdminAccessService.AI);
        AiBillingController controller = new AiBillingController(billing, access);

        assertEquals(HttpStatus.FORBIDDEN, controller.dashboard(authentication("admin")).getStatusCode());
    }

    @Test
    void blocksCitizenFromDashboard() {
        AiBillingController controller = new AiBillingController(
                mock(AiBillingService.class), mock(AdminAccessService.class));

        assertEquals(HttpStatus.FORBIDDEN, controller.dashboard(authentication("citizen")).getStatusCode());
    }

    private Authentication authentication(String role) {
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(
                new AuthenticatedUser("user-id", "Usuário", "12345678901", role, "est-1")
        );
        return authentication;
    }
}
