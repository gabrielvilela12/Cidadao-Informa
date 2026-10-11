package br.com.fiap.hackgov.application.dto.protocol;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record OperationalAnalyticsOutputDto(
        LocalDate startDate, LocalDate endDate, String timezone, Instant generatedAt,
        Summary summary, List<Distribution> distribution, List<Month> monthly, List<Recurrence> recurrence
) {
    public record Summary(long total, long completed, BigDecimal completionRate,
                          BigDecimal averageResolutionDays, long timedCompletions,
                          BigDecimal totalCost, BigDecimal averageCost, long costedCompletions) {}
    public record Distribution(String category, String status, long total) {}
    public record Month(String month, long opened, long completed) {}
    public record Recurrence(long position, String address, String category, long reports) {}
}
