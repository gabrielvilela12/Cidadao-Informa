package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.application.service.OperationalAnalyticsService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OperationalAnalyticsControllerTest {
    @Test
    void rejectsMissingSessionBeforeCallingService() {
        var service = mock(OperationalAnalyticsService.class);
        var controller = new OperationalAnalyticsController(service);
        var error = assertThrows(ResponseStatusException.class,
                () -> controller.get(LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30), null));
        assertEquals(HttpStatus.UNAUTHORIZED, error.getStatusCode());
        verifyNoInteractions(service);
    }
}
