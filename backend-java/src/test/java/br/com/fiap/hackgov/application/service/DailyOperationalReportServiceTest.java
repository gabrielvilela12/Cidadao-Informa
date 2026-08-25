package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.domain.audit.ProtocolAuditBlock;
import br.com.fiap.hackgov.domain.report.DailyOperationalReport;
import br.com.fiap.hackgov.domain.report.DailyOperationalReportProtocol;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaProtocolRepository;
import br.com.fiap.hackgov.infrastructure.repository.DailyOperationalReportProtocolRepository;
import br.com.fiap.hackgov.infrastructure.repository.DailyOperationalReportRepository;
import br.com.fiap.hackgov.infrastructure.repository.ProtocolAuditRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class DailyOperationalReportServiceTest {

    @Test
    void generatesOneIdempotentOperationalSnapshotForTheClosedDay() {
        JpaProtocolRepository protocols = mock(JpaProtocolRepository.class);
        ProtocolAuditRepository audits = mock(ProtocolAuditRepository.class);
        DailyOperationalReportRepository reports = mock(DailyOperationalReportRepository.class);
        DailyOperationalReportProtocolRepository details = mock(DailyOperationalReportProtocolRepository.class);
        DailyOperationalReportService service = new DailyOperationalReportService(
                protocols, audits, reports, details, new ObjectMapper());

        LocalDate date = LocalDate.of(2026, 8, 23);
        Instant createdAt = Instant.parse("2026-08-23T12:00:00Z");
        JpaProtocolRepository.DailyReportProtocolProjection protocol = projection(
                "abc123", "Física", "Rua A, 10 - Centro, São Paulo - SP", createdAt,
                "Concluído", new BigDecimal("150.50"));
        ProtocolAuditBlock change = audit("abc123", "STATUS_CHANGED", "Aberto", "Concluído",
                "2026-08-23T16:00:00Z", "150.50");

        when(reports.findByReportDate(date)).thenReturn(Optional.empty());
        when(protocols.findDailyReportDataCreatedBetween(any(), any())).thenReturn(List.of(protocol));
        when(protocols.findDailyReportDataByIdIn(any())).thenReturn(List.of(protocol));
        when(audits.findByCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtAsc(any(), any()))
                .thenReturn(List.of(change));

        var output = service.generate(date);

        assertThat(output.newProtocolsCount()).isEqualTo(1);
        assertThat(output.statusChangesCount()).isEqualTo(1);
        assertThat(output.totalSpent()).isEqualByComparingTo("150.50");
        assertThat(output.regionsCount()).isEqualTo(1);

        ArgumentCaptor<DailyOperationalReport> reportCaptor = ArgumentCaptor.forClass(DailyOperationalReport.class);
        verify(reports).save(reportCaptor.capture());
        assertThat(reportCaptor.getValue().getRegionDistribution())
                .containsExactly(Map.of("region", "Centro", "count", 1L));
        assertThat(reportCaptor.getValue().getStatusTransitions())
                .containsExactly(Map.of("fromStatus", "Aberto", "toStatus", "Concluído", "count", 1L));
        assertThat(reportCaptor.getValue().getSourceHash()).hasSize(64);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<DailyOperationalReportProtocol>> detailCaptor = ArgumentCaptor.forClass(List.class);
        verify(details).saveAll(detailCaptor.capture());
        assertThat(detailCaptor.getValue()).singleElement().satisfies(item -> {
            assertThat(item.isCreatedDuringPeriod()).isTrue();
            assertThat(item.getRegion()).isEqualTo("Centro");
            assertThat(item.getSpentDuringPeriod()).isEqualByComparingTo("150.50");
            assertThat(item.getStatusChanges()).hasSize(1);
        });
        verify(reports).lockGeneration("daily-report:" + date);
    }

    private JpaProtocolRepository.DailyReportProtocolProjection projection(
            String id, String category, String address, Instant createdAt, String status, BigDecimal cost) {
        return new JpaProtocolRepository.DailyReportProtocolProjection() {
            public String getId() { return id; }
            public String getCategory() { return category; }
            public String getAddress() { return address; }
            public String getStateCode() { return "SP"; }
            public Instant getCreatedAt() { return createdAt; }
            public String getStatus() { return status; }
            public BigDecimal getResolutionCost() { return cost; }
        };
    }

    private ProtocolAuditBlock audit(String protocolId, String event, String previous, String next,
                                     String createdAt, String cost) {
        ProtocolAuditBlock block = new ProtocolAuditBlock();
        block.setId(UUID.randomUUID());
        block.setProtocolId(protocolId);
        block.setEventType(event);
        block.setPreviousStatus(previous);
        block.setNewStatus(next);
        block.setCreatedAt(Instant.parse(createdAt));
        block.setPayloadHash("audit-hash");
        block.setPayload(Map.of("evidence", Map.of("resolution_cost", new BigDecimal(cost))));
        return block;
    }
}
