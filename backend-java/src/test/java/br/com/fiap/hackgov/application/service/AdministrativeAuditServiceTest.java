package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.application.dto.admin.DataExportAuditInputDto;
import br.com.fiap.hackgov.domain.audit.AdministrativeAuditEvent;
import br.com.fiap.hackgov.infrastructure.repository.AdministrativeAuditRepository;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdministrativeAuditServiceTest {

    @Mock
    private AdministrativeAuditRepository repository;

    @Test
    void protectsSensitiveResourceIdentifierAndStoresOnlyExportMetadata() {
        AdministrativeAuditService service = serviceWithPersistedIds();
        String sensitiveResourceId = "citizen-internal-id";

        var output = service.recordExport(
                actor(),
                new DataExportAuditInputDto("DAILY_REPORT_DETAIL", "PDF", 42, sensitiveResourceId)
        );

        assertEquals(AdministrativeAuditService.DATA_EXPORTED, output.action());
        assertEquals("PDF", output.metadata().get("format"));
        assertEquals(42, output.metadata().get("record_count"));
        assertNotNull(output.resourceIdHash());
        assertNotEquals(sensitiveResourceId, output.resourceIdHash());
        assertEquals(64, output.resourceIdHash().length());
    }

    @Test
    void rejectsUnknownExportResourceWithoutWritingAuditEvent() {
        AdministrativeAuditService service = new AdministrativeAuditService(repository);

        assertThrows(IllegalArgumentException.class, () -> service.recordExport(
                actor(),
                new DataExportAuditInputDto("PASSWORDS", "CSV", 1, null)
        ));

        verify(repository, never()).save(any());
    }

    @Test
    void recordsCitizenViewWithoutCopyingCitizenData() {
        AdministrativeAuditService service = serviceWithPersistedIds();

        var output = service.recordCitizenViewed(actor(), "citizen-123", 7);

        assertEquals(AdministrativeAuditService.CITIZEN_VIEWED, output.action());
        assertEquals("CITIZEN", output.resourceType());
        assertEquals(7, output.metadata().get("protocol_count"));
        assertNotEquals("citizen-123", output.resourceIdHash());
    }

    @Test
    void searchesByActionActorAndPeriodWithBoundedPagination() {
        AdministrativeAuditService service = new AdministrativeAuditService(repository);
        Instant from = Instant.parse("2026-09-01T00:00:00Z");
        Instant to = Instant.parse("2026-10-01T00:00:00Z");
        when(repository.search(
                eq(AdministrativeAuditService.DATA_EXPORTED),
                eq("admin-1"),
                eq(from),
                eq(to),
                any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.of()));

        var result = service.search("data_exported", "admin-1", from, to, 0, 20);

        assertEquals(0, result.getTotalElements());
        verify(repository).search(
                eq(AdministrativeAuditService.DATA_EXPORTED), eq("admin-1"),
                eq(from), eq(to), any(Pageable.class)
        );
    }

    private AdministrativeAuditService serviceWithPersistedIds() {
        when(repository.save(any(AdministrativeAuditEvent.class))).thenAnswer(invocation -> {
            AdministrativeAuditEvent event = invocation.getArgument(0);
            event.prePersist();
            return event;
        });
        return new AdministrativeAuditService(repository);
    }

    private AuthenticatedUser actor() {
        return new AuthenticatedUser("admin-1", "Servidor", "00000000000", "admin", "city-hall-1");
    }
}
