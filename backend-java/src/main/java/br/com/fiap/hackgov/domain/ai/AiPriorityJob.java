package br.com.fiap.hackgov.domain.ai;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ai_priority_jobs")
public class AiPriorityJob {
    @Id
    private UUID id;

    @Column(name = "protocol_id", nullable = false)
    private UUID protocolId;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private String category;

    @Column(name = "result_priority")
    private String resultPriority;

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "attempt_count")
    private Integer attemptCount = 1;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "processing_started_at")
    private LocalDateTime processingStartedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public AiPriorityJob() {
    }

    public AiPriorityJob(String protocolId, String description, String category) {
        this.id = UUID.randomUUID();
        this.protocolId = UUID.fromString(protocolId);
        this.description = description;
        this.category = category;
        this.status = "pending";
        this.attemptCount = 1;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getProtocolId() { return protocolId; }
    public void setProtocolId(UUID protocolId) { this.protocolId = protocolId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getResultPriority() { return resultPriority; }
    public void setResultPriority(String resultPriority) { this.resultPriority = resultPriority; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public Integer getAttemptCount() { return attemptCount; }
    public void setAttemptCount(Integer attemptCount) { this.attemptCount = attemptCount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getProcessingStartedAt() { return processingStartedAt; }
    public void setProcessingStartedAt(LocalDateTime processingStartedAt) { this.processingStartedAt = processingStartedAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
