package br.com.fiap.hackgov.domain.ai;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Entity
@Table(name = "ai_chat_cache")
public class AiChatCache {

    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @Column(name = "establishment_id", nullable = false)
    private String establishmentId;

    @Column(name = "normalized_question", nullable = false)
    private String normalizedQuestion;

    @Column(name = "question", nullable = false)
    private String question;

    @Column(name = "answer", nullable = false, columnDefinition = "TEXT")
    private String answer;

    @Column(name = "topics_json", nullable = false, columnDefinition = "TEXT")
    private String topicsJson;

    @Column(name = "model", nullable = false)
    private String model;

    @Column(name = "embedding", nullable = false, columnDefinition = "TEXT")
    private String embedding;

    @Column(name = "source_generation_id")
    private String sourceGenerationId;

    @Column(name = "hit_count", nullable = false)
    private long hitCount;

    @Column(name = "last_hit_at")
    private Instant lastHitAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @PrePersist
    public void prePersist() {
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
        }
        if (topicsJson == null || topicsJson.isBlank()) {
            topicsJson = "[]";
        }
        if (model == null || model.isBlank()) {
            model = "cache";
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (expiresAt == null) {
            expiresAt = createdAt.plus(30, ChronoUnit.DAYS);
        }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEstablishmentId() {
        return establishmentId;
    }

    public void setEstablishmentId(String establishmentId) {
        this.establishmentId = establishmentId;
    }

    public String getNormalizedQuestion() {
        return normalizedQuestion;
    }

    public void setNormalizedQuestion(String normalizedQuestion) {
        this.normalizedQuestion = normalizedQuestion;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public String getTopicsJson() {
        return topicsJson;
    }

    public void setTopicsJson(String topicsJson) {
        this.topicsJson = topicsJson;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getEmbedding() {
        return embedding;
    }

    public void setEmbedding(String embedding) {
        this.embedding = embedding;
    }

    public String getSourceGenerationId() {
        return sourceGenerationId;
    }

    public void setSourceGenerationId(String sourceGenerationId) {
        this.sourceGenerationId = sourceGenerationId;
    }

    public long getHitCount() {
        return hitCount;
    }

    public void setHitCount(long hitCount) {
        this.hitCount = hitCount;
    }

    public Instant getLastHitAt() {
        return lastHitAt;
    }

    public void setLastHitAt(Instant lastHitAt) {
        this.lastHitAt = lastHitAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }
}
