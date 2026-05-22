package br.com.fiap.hackgov.domain.ai;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ai_job_logs")
public class AiJobLog {
    @Id
    private UUID id;

    @Column(name = "protocol_id", nullable = false)
    private String protocolId;

    @Column(nullable = false)
    private String priority;

    @Column(nullable = false)
    private String source;

    @Column(name = "admin_id")
    private UUID adminId;

    @Column(name = "previous_priority")
    private String previousPriority;

    @Column(nullable = true)
    private String reason;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public AiJobLog() {
    }

    public AiJobLog(String protocolId, String priority, String source) {
        this.id = UUID.randomUUID();
        this.protocolId = protocolId;
        this.priority = priority;
        this.source = source;
        this.createdAt = LocalDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getProtocolId() { return protocolId; }
    public void setProtocolId(String protocolId) { this.protocolId = protocolId; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public UUID getAdminId() { return adminId; }
    public void setAdminId(UUID adminId) { this.adminId = adminId; }
    public String getPreviousPriority() { return previousPriority; }
    public void setPreviousPriority(String previousPriority) { this.previousPriority = previousPriority; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
