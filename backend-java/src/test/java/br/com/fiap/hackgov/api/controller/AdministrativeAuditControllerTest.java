package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.application.dto.admin.DataExportAuditInputDto;
import br.com.fiap.hackgov.application.service.AdminAccessService;
import br.com.fiap.hackgov.application.service.AdministrativeAuditService;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.data.domain.Page;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdministrativeAuditControllerTest {

    @Test
    void recordsReportExportOnlyAfterCheckingScreenPermission() {
        AdministrativeAuditService audit = mock(AdministrativeAuditService.class);
        AdminAccessService access = mock(AdminAccessService.class);
        AdministrativeAuditController controller = new AdministrativeAuditController(audit, access);
        DataExportAuditInputDto input = new DataExportAuditInputDto("DAILY_REPORTS", "PDF", 5, null);
        AuthenticatedUser user = user("admin");

        var response = controller.recordExport(input, authentication(user));

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        verify(access).requireScreen("user-id", AdminAccessService.REPORTS);
        verify(audit).recordExport(user, input);
    }

    @Test
    void allowsOnlyPlatformOwnerToSearchGlobalAuditTrail() {
        AdministrativeAuditService audit = mock(AdministrativeAuditService.class);
        AdministrativeAuditController controller = new AdministrativeAuditController(
                audit,
                mock(AdminAccessService.class)
        );

        var response = controller.search(
                "DATA_EXPORTED", null, null, null, 0, 20,
                authentication(user("admin"))
        );

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        verify(audit, never()).search(any(), any(), any(), any(), anyInt(), anyInt());
    }

    @Test
    void platformOwnerCanFilterAuditTrail() {
        AdministrativeAuditService audit = mock(AdministrativeAuditService.class);
        AdministrativeAuditController controller = new AdministrativeAuditController(
                audit,
                mock(AdminAccessService.class)
        );
        Instant from = Instant.parse("2026-09-01T00:00:00Z");
        Instant to = Instant.parse("2026-10-01T00:00:00Z");
        when(audit.search("DATA_EXPORTED", "admin-1", from, to, 1, 30)).thenReturn(Page.empty());

        var response = controller.search(
                "DATA_EXPORTED", "admin-1", from, to, 1, 30,
                authentication(user("platform_owner"))
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(audit).search("DATA_EXPORTED", "admin-1", from, to, 1, 30);
        verify(audit).recordAuditTrailViewed(user("platform_owner"), "admin-1", "DATA_EXPORTED", 0);
    }

    private AuthenticatedUser user(String role) {
        return new AuthenticatedUser("user-id", "Usuário", "00000000000", role);
    }

    private Authentication authentication(AuthenticatedUser user) {
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(user);
        return authentication;
    }
}
