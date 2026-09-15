package br.com.fiap.hackgov.application.dto.protocol;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record TransparencyOutputDto(
        Instant generatedAt,
        Overview overview,
        List<Metric> statusDistribution,
        List<Metric> categoryDistribution,
        List<Metric> priorityDistribution,
        List<MonthlyPoint> monthlyEvolution,
        SlaSummary sla,
        StatisticalSummary statistics,
        AiSummary ai,
        DataQuality dataQuality,
        AuditSummary audit,
        List<GeoCluster> geography,
        List<RecentProtocol> recentProtocols
) {
    public record Overview(
            long total,
            long open,
            long inAnalysis,
            long completed,
            BigDecimal totalResolutionCost,
            long completedWithCost,
            long citizens,
            Integer resolutionRate
    ) {
    }

    public record Metric(String label, long value) {
    }

    public record MonthlyPoint(String month, long registered, long currentlyCompleted) {
    }

    public record SlaSummary(
            long evaluated,
            long onTime,
            long dueSoon,
            long late,
            Integer onTimeRate
    ) {
    }

    public record StatisticalSummary(
            SampleSummary resolutionTimeHours,
            SampleSummary openBacklogAgeDays,
            SampleSummary resolutionCostBrl,
            long completedWithoutResolvedAt,
            Integer resolutionTimeCoverageRate,
            Integer resolutionCostCoverageRate
    ) {
    }

    public record SampleSummary(
            long sampleSize,
            Double mean,
            Double median,
            Double p90,
            Double standardDeviation
    ) {
    }

    public record AiSummary(
            long total,
            long classified,
            long pending,
            long failed,
            Integer coverageRate,
            String model
    ) {
    }

    public record DataQuality(
            long withCoordinates,
            long withoutCoordinates,
            long withAiClassification,
            long withoutAiClassification
    ) {
    }

    public record AuditSummary(boolean valid, int totalBlocks, Instant verifiedAt) {
    }

    public record GeoCluster(double latitude, double longitude, long count) {
    }

    public record RecentProtocol(
            String publicId,
            String category,
            String location,
            Instant createdAt,
            String status,
            BigDecimal resolutionCost,
            String priority
    ) {
    }
}
