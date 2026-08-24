package br.com.fiap.hackgov.domain.report;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "daily_operational_reports")
public class DailyOperationalReport {
    @Id private UUID id;
    @Column(name = "report_date", nullable = false, unique = true) private LocalDate reportDate;
    @Column(name = "period_start", nullable = false) private Instant periodStart;
    @Column(name = "period_end", nullable = false) private Instant periodEnd;
    @Column(name = "new_protocols_count", nullable = false) private int newProtocolsCount;
    @Column(name = "status_changes_count", nullable = false) private int statusChangesCount;
    @Column(name = "protocols_involved_count", nullable = false) private int protocolsInvolvedCount;
    @Column(name = "total_spent", nullable = false, precision = 14, scale = 2) private BigDecimal totalSpent;
    @JdbcTypeCode(SqlTypes.JSON) @Column(name = "status_transitions", nullable = false, columnDefinition = "jsonb")
    private List<Map<String, Object>> statusTransitions = new ArrayList<>();
    @JdbcTypeCode(SqlTypes.JSON) @Column(name = "region_distribution", nullable = false, columnDefinition = "jsonb")
    private List<Map<String, Object>> regionDistribution = new ArrayList<>();
    @Column(name = "source_hash", nullable = false) private String sourceHash;
    @Column(name = "generated_at", nullable = false) private Instant generatedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public LocalDate getReportDate() { return reportDate; }
    public void setReportDate(LocalDate reportDate) { this.reportDate = reportDate; }
    public Instant getPeriodStart() { return periodStart; }
    public void setPeriodStart(Instant periodStart) { this.periodStart = periodStart; }
    public Instant getPeriodEnd() { return periodEnd; }
    public void setPeriodEnd(Instant periodEnd) { this.periodEnd = periodEnd; }
    public int getNewProtocolsCount() { return newProtocolsCount; }
    public void setNewProtocolsCount(int value) { this.newProtocolsCount = value; }
    public int getStatusChangesCount() { return statusChangesCount; }
    public void setStatusChangesCount(int value) { this.statusChangesCount = value; }
    public int getProtocolsInvolvedCount() { return protocolsInvolvedCount; }
    public void setProtocolsInvolvedCount(int value) { this.protocolsInvolvedCount = value; }
    public BigDecimal getTotalSpent() { return totalSpent; }
    public void setTotalSpent(BigDecimal value) { this.totalSpent = value; }
    public List<Map<String, Object>> getStatusTransitions() { return statusTransitions; }
    public void setStatusTransitions(List<Map<String, Object>> value) { this.statusTransitions = value; }
    public List<Map<String, Object>> getRegionDistribution() { return regionDistribution; }
    public void setRegionDistribution(List<Map<String, Object>> value) { this.regionDistribution = value; }
    public String getSourceHash() { return sourceHash; }
    public void setSourceHash(String sourceHash) { this.sourceHash = sourceHash; }
    public Instant getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(Instant generatedAt) { this.generatedAt = generatedAt; }
}
