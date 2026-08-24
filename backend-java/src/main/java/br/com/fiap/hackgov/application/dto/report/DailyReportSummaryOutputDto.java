package br.com.fiap.hackgov.application.dto.report;

import br.com.fiap.hackgov.domain.report.DailyOperationalReport;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record DailyReportSummaryOutputDto(
        UUID id,
        LocalDate reportDate,
        Instant generatedAt,
        int newProtocolsCount,
        int statusChangesCount,
        int protocolsInvolvedCount,
        BigDecimal totalSpent,
        int regionsCount
) {
    public static DailyReportSummaryOutputDto from(DailyOperationalReport report) {
        return new DailyReportSummaryOutputDto(report.getId(), report.getReportDate(), report.getGeneratedAt(),
                report.getNewProtocolsCount(), report.getStatusChangesCount(), report.getProtocolsInvolvedCount(),
                report.getTotalSpent(), report.getRegionDistribution().size());
    }
}
