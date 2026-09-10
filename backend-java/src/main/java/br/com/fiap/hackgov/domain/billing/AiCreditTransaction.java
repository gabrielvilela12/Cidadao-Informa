package br.com.fiap.hackgov.domain.billing;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_credit_transactions")
public class AiCreditTransaction {

    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @Column(name = "establishment_id", nullable = false)
    private String establishmentId;

    @Column(name = "type", nullable = false)
    private String type;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "amount_brl", nullable = false, precision = 18, scale = 6)
    private BigDecimal amountBrl;

    @Column(name = "reserved_amount_brl", nullable = false, precision = 18, scale = 6)
    private BigDecimal reservedAmountBrl;

    @Column(name = "balance_after_brl", nullable = false, precision = 18, scale = 6)
    private BigDecimal balanceAfterBrl;

    @Column(name = "reference_id")
    private String referenceId;

    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "settled_at")
    private Instant settledAt;

    @PrePersist
    public void prePersist() {
        if (id == null || id.isBlank()) id = UUID.randomUUID().toString();
        if (status == null || status.isBlank()) status = "completed";
        if (amountBrl == null) amountBrl = BigDecimal.ZERO;
        if (reservedAmountBrl == null) reservedAmountBrl = BigDecimal.ZERO;
        if (description == null) description = "";
        if (createdAt == null) createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEstablishmentId() { return establishmentId; }
    public void setEstablishmentId(String establishmentId) { this.establishmentId = establishmentId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public BigDecimal getAmountBrl() { return amountBrl; }
    public void setAmountBrl(BigDecimal amountBrl) { this.amountBrl = amountBrl; }
    public BigDecimal getReservedAmountBrl() { return reservedAmountBrl; }
    public void setReservedAmountBrl(BigDecimal reservedAmountBrl) { this.reservedAmountBrl = reservedAmountBrl; }
    public BigDecimal getBalanceAfterBrl() { return balanceAfterBrl; }
    public void setBalanceAfterBrl(BigDecimal balanceAfterBrl) { this.balanceAfterBrl = balanceAfterBrl; }
    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getSettledAt() { return settledAt; }
    public void setSettledAt(Instant settledAt) { this.settledAt = settledAt; }
}
