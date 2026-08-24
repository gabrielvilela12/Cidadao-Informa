package br.com.fiap.hackgov.domain.report;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "daily_operational_report_protocols")
public class DailyOperationalReportProtocol {
    @Id private UUID id;
    @Column(name = "report_id", nullable = false) private UUID reportId;
    @Column(name = "protocol_id", nullable = false) private String protocolId;
    @Column(nullable = false) private String category;
    @Column(nullable = false) private String address;
    @Column(nullable = false) private String region;
    @Column(name = "current_status", nullable = false) private String currentStatus;
    @Column(name = "protocol_created_at", nullable = false) private Instant protocolCreatedAt;
    @Column(name = "created_during_period", nullable = false) private boolean createdDuringPeriod;
    @Column(name = "resolution_cost", precision = 12, scale = 2) private BigDecimal resolutionCost;
    @Column(name = "spent_during_period", nullable = false, precision = 12, scale = 2) private BigDecimal spentDuringPeriod;
    @JdbcTypeCode(SqlTypes.JSON) @Column(name = "status_changes", nullable = false, columnDefinition = "jsonb")
    private List<Map<String, Object>> statusChanges = new ArrayList<>();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getReportId() { return reportId; }
    public void setReportId(UUID reportId) { this.reportId = reportId; }
    public String getProtocolId() { return protocolId; }
    public void setProtocolId(String value) { this.protocolId = value; }
    public String getCategory() { return category; }
    public void setCategory(String value) { this.category = value; }
    public String getAddress() { return address; }
    public void setAddress(String value) { this.address = value; }
    public String getRegion() { return region; }
    public void setRegion(String value) { this.region = value; }
    public String getCurrentStatus() { return currentStatus; }
    public void setCurrentStatus(String value) { this.currentStatus = value; }
    public Instant getProtocolCreatedAt() { return protocolCreatedAt; }
    public void setProtocolCreatedAt(Instant value) { this.protocolCreatedAt = value; }
    public boolean isCreatedDuringPeriod() { return createdDuringPeriod; }
    public void setCreatedDuringPeriod(boolean value) { this.createdDuringPeriod = value; }
    public BigDecimal getResolutionCost() { return resolutionCost; }
    public void setResolutionCost(BigDecimal value) { this.resolutionCost = value; }
    public BigDecimal getSpentDuringPeriod() { return spentDuringPeriod; }
    public void setSpentDuringPeriod(BigDecimal value) { this.spentDuringPeriod = value; }
    public List<Map<String, Object>> getStatusChanges() { return statusChanges; }
    public void setStatusChanges(List<Map<String, Object>> value) { this.statusChanges = value; }
}
