package br.com.fiap.hackgov.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "protocols")
public class Protocol {

    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @Column(name = "category", nullable = false)
    private String category;

    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "address", nullable = false)
    private String address;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User user;

    @Column(name = "requester", nullable = false)
    private String requester;

    @Column(name = "ai_priority")
    private String aiPriority;

    @Column(name = "ai_status")
    private String aiStatus;

    // Posicao confirmada pelo solicitante no mapa. NULL = sem localizacao
    // confirmada; nesse caso as telas nao renderizam pin.
    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "image_urls", nullable = false, columnDefinition = "jsonb")
    private List<String> imageUrls = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "corrected_image_urls", nullable = false, columnDefinition = "jsonb")
    private List<String> correctedImageUrls = new ArrayList<>();

    @Column(name = "correction_status", nullable = false)
    private String correctionStatus = "idle";

    @Column(name = "correction_error")
    private String correctionError;

    @Column(name = "correction_generated_at")
    private Instant correctionGeneratedAt;

    @Column(name = "correction_report")
    private String correctionReport;

    @PrePersist
    public void prePersist() {
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (status == null) {
            status = "Aberto";
        }
        if (requester == null) {
            requester = "";
        }
        if (imageUrls == null) {
            imageUrls = new ArrayList<>();
        }
        if (correctedImageUrls == null) {
            correctedImageUrls = new ArrayList<>();
        }
        if (correctionStatus == null || correctionStatus.isBlank()) {
            correctionStatus = "idle";
        }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getRequester() {
        return requester;
    }

    public void setRequester(String requester) {
        this.requester = requester;
    }

    public String getAiPriority() {
        return aiPriority;
    }

    public void setAiPriority(String aiPriority) {
        this.aiPriority = aiPriority;
    }

    public String getAiStatus() {
        return aiStatus;
    }

    public void setAiStatus(String aiStatus) {
        this.aiStatus = aiStatus;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public List<String> getImageUrls() {
        return imageUrls == null ? List.of() : List.copyOf(imageUrls);
    }

    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls == null ? new ArrayList<>() : new ArrayList<>(imageUrls);
    }

    public List<String> getCorrectedImageUrls() {
        return correctedImageUrls == null ? List.of() : List.copyOf(correctedImageUrls);
    }

    public void setCorrectedImageUrls(List<String> correctedImageUrls) {
        this.correctedImageUrls = correctedImageUrls == null ? new ArrayList<>() : new ArrayList<>(correctedImageUrls);
    }

    public String getCorrectionStatus() {
        return correctionStatus;
    }

    public void setCorrectionStatus(String correctionStatus) {
        this.correctionStatus = correctionStatus;
    }

    public String getCorrectionError() {
        return correctionError;
    }

    public void setCorrectionError(String correctionError) {
        this.correctionError = correctionError;
    }

    public Instant getCorrectionGeneratedAt() {
        return correctionGeneratedAt;
    }

    public void setCorrectionGeneratedAt(Instant correctionGeneratedAt) {
        this.correctionGeneratedAt = correctionGeneratedAt;
    }

    public String getCorrectionReport() {
        return correctionReport;
    }

    public void setCorrectionReport(String correctionReport) {
        this.correctionReport = correctionReport;
    }
}
