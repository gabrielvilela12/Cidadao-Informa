package br.com.fiap.hackgov.domain.billing;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "ai_credit_wallets")
public class AiCreditWallet {

    @Id
    @Column(name = "establishment_id", nullable = false)
    private String establishmentId;

    @Column(name = "balance_brl", nullable = false, precision = 18, scale = 6)
    private BigDecimal balanceBrl;

    @Column(name = "total_credited_brl", nullable = false, precision = 18, scale = 6)
    private BigDecimal totalCreditedBrl;

    @Column(name = "total_consumed_brl", nullable = false, precision = 18, scale = 6)
    private BigDecimal totalConsumedBrl;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        if (balanceBrl == null) balanceBrl = BigDecimal.ZERO;
        if (totalCreditedBrl == null) totalCreditedBrl = BigDecimal.ZERO;
        if (totalConsumedBrl == null) totalConsumedBrl = BigDecimal.ZERO;
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }

    public String getEstablishmentId() { return establishmentId; }
    public void setEstablishmentId(String establishmentId) { this.establishmentId = establishmentId; }
    public BigDecimal getBalanceBrl() { return balanceBrl; }
    public void setBalanceBrl(BigDecimal balanceBrl) { this.balanceBrl = balanceBrl; }
    public BigDecimal getTotalCreditedBrl() { return totalCreditedBrl; }
    public void setTotalCreditedBrl(BigDecimal totalCreditedBrl) { this.totalCreditedBrl = totalCreditedBrl; }
    public BigDecimal getTotalConsumedBrl() { return totalConsumedBrl; }
    public void setTotalConsumedBrl(BigDecimal totalConsumedBrl) { this.totalConsumedBrl = totalConsumedBrl; }
    public Long getVersion() { return version; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
