package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.infrastructure.repository.OperationalAnalyticsRepository;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OperationalAnalyticsServiceTest {
    private final OperationalAnalyticsRepository repository = mock(OperationalAnalyticsRepository.class);
    private final ServerStatePermissionService permissions = mock(ServerStatePermissionService.class);
    private final OperationalAnalyticsService service = new OperationalAnalyticsService(repository, permissions);
    private final LocalDate start = LocalDate.of(2026, 9, 1);
    private final LocalDate end = LocalDate.of(2026, 9, 30);

    @Test
    void scopesMunicipalAdministratorAndIncludesEntireLastDayInBrazil() {
        service.get(new AuthenticatedUser("admin", "", "", "admin", "city-a"), start, end);
        verify(repository).query(start, end, Instant.parse("2026-09-01T03:00:00Z"),
                Instant.parse("2026-10-01T03:00:00Z"), false, "city-a", Set.of());
        verifyNoInteractions(permissions);
    }

    @Test
    void restrictsAdministratorWithoutMunicipalityToDelegatedStates() {
        when(permissions.allowedStates("admin")).thenReturn(Set.of("SP"));
        service.get(new AuthenticatedUser("admin", "", "", "admin"), start, end);
        verify(repository).query(eq(start), eq(end), any(), any(), eq(false), isNull(), eq(Set.of("SP")));
    }

    @Test
    void grantsGlobalScopeOnlyToPlatformOwner() {
        service.get(new AuthenticatedUser("owner", "", "", "platform_owner", "ignored-city"), start, end);
        verify(repository).query(eq(start), eq(end), any(), any(), eq(true), isNull(), eq(Set.of()));
    }

    @Test
    void rejectsCitizenAndInvalidPeriodsBeforeReadingData() {
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(ResponseStatusException.class,
                () -> service.get(new AuthenticatedUser("citizen", "", "", "citizen"), start, end)).getStatusCode());
        var admin = new AuthenticatedUser("admin", "", "", "admin");
        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ResponseStatusException.class,
                () -> service.get(admin, end, start)).getStatusCode());
        assertThrows(ResponseStatusException.class, () -> service.get(admin, start, start.plusDays(731)));
        verifyNoInteractions(repository);
    }
}
