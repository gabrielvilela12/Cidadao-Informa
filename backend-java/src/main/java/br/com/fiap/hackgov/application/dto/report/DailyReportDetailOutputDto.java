package br.com.fiap.hackgov.application.dto.report;

import br.com.fiap.hackgov.domain.report.DailyOperationalReport;
import br.com.fiap.hackgov.domain.report.DailyOperationalReportProtocol;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.LinkedHashMap;
import java.util.TreeMap;

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

    public static DailyReportDetailOutputDto scoped(DailyOperationalReport report,
                                                     List<DailyOperationalReportProtocol> details) {
        int newProtocols = (int) details.stream().filter(DailyOperationalReportProtocol::isCreatedDuringPeriod).count();
        int statusChanges = details.stream().mapToInt(item -> item.getStatusChanges().size()).sum();
        BigDecimal spent = details.stream().map(DailyOperationalReportProtocol::getSpentDuringPeriod)
                .filter(java.util.Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Long> regionTotals = new TreeMap<>();
        details.forEach(item -> regionTotals.merge(item.getRegion(), 1L, Long::sum));
        List<Map<String, Object>> regions = regionTotals.entrySet().stream()
                .map(entry -> Map.<String, Object>of("region", entry.getKey(), "count", entry.getValue()))
                .toList();

        Map<String, Long> transitionTotals = new LinkedHashMap<>();
        details.forEach(item -> item.getStatusChanges().forEach(change -> {
            String key = java.util.Objects.toString(change.get("fromStatus"), "") + "\u0000"
                    + java.util.Objects.toString(change.get("toStatus"), "");
            transitionTotals.merge(key, 1L, Long::sum);
        }));
        List<Map<String, Object>> transitions = transitionTotals.entrySet().stream().map(entry -> {
            String[] parts = entry.getKey().split("\u0000", -1);
            return Map.<String, Object>of("fromStatus", parts[0], "toStatus", parts[1], "count", entry.getValue());
        }).toList();

        return new DailyReportDetailOutputDto(
                report.getId(), report.getReportDate(), report.getPeriodStart(), report.getPeriodEnd(),
                report.getGeneratedAt(), newProtocols, statusChanges, details.size(), spent, regions.size(),
                transitions, regions, details.stream().map(ProtocolItem::from).toList()
        );
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
