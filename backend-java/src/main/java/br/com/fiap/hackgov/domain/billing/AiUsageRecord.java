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
@Table(name = "ai_usage_records")
public class AiUsageRecord {

    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @Column(name = "establishment_id", nullable = false)
    private String establishmentId;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "transaction_id", nullable = false, unique = true)
    private String transactionId;

    @Column(name = "generation_id")
    private String generationId;

    @Column(name = "feature", nullable = false)
    private String feature;

    @Column(name = "model", nullable = false)
    private String model;

    @Column(name = "prompt_tokens", nullable = false)
    private Long promptTokens;

    @Column(name = "completion_tokens", nullable = false)
    private Long completionTokens;

    @Column(name = "total_tokens", nullable = false)
    private Long totalTokens;

    @Column(name = "reasoning_tokens", nullable = false)
    private Long reasoningTokens;

    @Column(name = "cached_tokens", nullable = false)
    private Long cachedTokens;

    @Column(name = "openrouter_cost_usd", nullable = false, precision = 18, scale = 10)
    private BigDecimal openRouterCostUsd;

    @Column(name = "upstream_inference_cost_usd", nullable = false, precision = 18, scale = 10)
    private BigDecimal upstreamInferenceCostUsd;

    @Column(name = "usd_to_brl_rate", nullable = false, precision = 12, scale = 6)
    private BigDecimal usdToBrlRate;

    @Column(name = "markup_percent", nullable = false, precision = 8, scale = 4)
    private BigDecimal markupPercent;

    @Column(name = "charged_amount_brl", nullable = false, precision = 18, scale = 6)
    private BigDecimal chargedAmountBrl;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (id == null || id.isBlank()) id = UUID.randomUUID().toString();
        if (feature == null || feature.isBlank()) feature = "chatbot";
        if (promptTokens == null) promptTokens = 0L;
        if (completionTokens == null) completionTokens = 0L;
        if (totalTokens == null) totalTokens = 0L;
        if (reasoningTokens == null) reasoningTokens = 0L;
        if (cachedTokens == null) cachedTokens = 0L;
        if (openRouterCostUsd == null) openRouterCostUsd = BigDecimal.ZERO;
        if (upstreamInferenceCostUsd == null) upstreamInferenceCostUsd = BigDecimal.ZERO;
        if (markupPercent == null) markupPercent = BigDecimal.ZERO;
        if (chargedAmountBrl == null) chargedAmountBrl = BigDecimal.ZERO;
        if (createdAt == null) createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEstablishmentId() { return establishmentId; }
    public void setEstablishmentId(String establishmentId) { this.establishmentId = establishmentId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    public String getGenerationId() { return generationId; }
    public void setGenerationId(String generationId) { this.generationId = generationId; }
    public String getFeature() { return feature; }
    public void setFeature(String feature) { this.feature = feature; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public Long getPromptTokens() { return promptTokens; }
    public void setPromptTokens(Long promptTokens) { this.promptTokens = promptTokens; }
    public Long getCompletionTokens() { return completionTokens; }
    public void setCompletionTokens(Long completionTokens) { this.completionTokens = completionTokens; }
    public Long getTotalTokens() { return totalTokens; }
    public void setTotalTokens(Long totalTokens) { this.totalTokens = totalTokens; }
    public Long getReasoningTokens() { return reasoningTokens; }
    public void setReasoningTokens(Long reasoningTokens) { this.reasoningTokens = reasoningTokens; }
    public Long getCachedTokens() { return cachedTokens; }
    public void setCachedTokens(Long cachedTokens) { this.cachedTokens = cachedTokens; }
    public BigDecimal getOpenRouterCostUsd() { return openRouterCostUsd; }
    public void setOpenRouterCostUsd(BigDecimal openRouterCostUsd) { this.openRouterCostUsd = openRouterCostUsd; }
    public BigDecimal getUpstreamInferenceCostUsd() { return upstreamInferenceCostUsd; }
    public void setUpstreamInferenceCostUsd(BigDecimal upstreamInferenceCostUsd) { this.upstreamInferenceCostUsd = upstreamInferenceCostUsd; }
    public BigDecimal getUsdToBrlRate() { return usdToBrlRate; }
    public void setUsdToBrlRate(BigDecimal usdToBrlRate) { this.usdToBrlRate = usdToBrlRate; }
    public BigDecimal getMarkupPercent() { return markupPercent; }
    public void setMarkupPercent(BigDecimal markupPercent) { this.markupPercent = markupPercent; }
    public BigDecimal getChargedAmountBrl() { return chargedAmountBrl; }
    public void setChargedAmountBrl(BigDecimal chargedAmountBrl) { this.chargedAmountBrl = chargedAmountBrl; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
