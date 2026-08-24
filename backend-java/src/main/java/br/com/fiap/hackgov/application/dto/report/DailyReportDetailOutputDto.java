package br.com.fiap.hackgov.application.dto.report;

import br.com.fiap.hackgov.domain.report.DailyOperationalReport;
import br.com.fiap.hackgov.domain.report.DailyOperationalReportProtocol;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record DailyReportDetailOutputDto(
        UUID id, LocalDate reportDate, Instant periodStart, Instant periodEnd, Instant generatedAt,
        int newProtocolsCount, int statusChangesCount, int protocolsInvolvedCount, BigDecimal totalSpent, int regionsCount,
        List<Map<String, Object>> statusTransitions, List<Map<String, Object>> regionDistribution,
        List<ProtocolItem> protocols
) {
    public static DailyReportDetailOutputDto from(DailyOperationalReport report,
                                                   List<DailyOperationalReportProtocol> details) {
        return new DailyReportDetailOutputDto(report.getId(), report.getReportDate(), report.getPeriodStart(),
                report.getPeriodEnd(), report.getGeneratedAt(), report.getNewProtocolsCount(),
                report.getStatusChangesCount(), report.getProtocolsInvolvedCount(), report.getTotalSpent(), report.getRegionDistribution().size(),
                report.getStatusTransitions(), report.getRegionDistribution(),
                details.stream().map(ProtocolItem::from).toList());
    }

    public record ProtocolItem(
            String protocolId, String category, String address, String region, String currentStatus,
            Instant protocolCreatedAt, boolean createdDuringPeriod, BigDecimal resolutionCost,
            BigDecimal spentDuringPeriod, List<Map<String, Object>> statusChanges
    ) {
        static ProtocolItem from(DailyOperationalReportProtocol item) {
            return new ProtocolItem(item.getProtocolId(), item.getCategory(), item.getAddress(), item.getRegion(),
                    item.getCurrentStatus(), item.getProtocolCreatedAt(), item.isCreatedDuringPeriod(),
                    item.getResolutionCost(), item.getSpentDuringPeriod(), item.getStatusChanges());
        }
    }
}
