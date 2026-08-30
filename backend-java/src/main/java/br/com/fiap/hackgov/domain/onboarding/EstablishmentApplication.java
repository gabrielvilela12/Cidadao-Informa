package br.com.fiap.hackgov.domain.onboarding;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "establishment_applications")
public class EstablishmentApplication {

    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @Column(name = "establishment_name", nullable = false)
    private String establishmentName;

    @Column(name = "document")
    private String document;

    @Column(name = "city", nullable = false)
    private String city;

    @Column(name = "state", nullable = false)
    private String state;

    @Column(name = "primary_color", nullable = false)
    private String primaryColor;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "campaign_name")
    private String campaignName;

    @Column(name = "campaign_scope", nullable = false)
    private String campaignScope;

    @Column(name = "plan_code", nullable = false)
    private String planCode;

    @Column(name = "requester_user_id", nullable = false)
    private String requesterUserId;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "reviewed_by")
    private String reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "created_establishment_id")
    private String createdEstablishmentId;

    @Column(name = "created_subscription_id")
    private String createdSubscriptionId;

    @Column(name = "created_campaign_id")
    private String createdCampaignId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
        }
        if (primaryColor == null || primaryColor.isBlank()) {
            primaryColor = "#0758BD";
        }
        if (campaignScope == null || campaignScope.isBlank()) {
            campaignScope = "city";
        }
        if (status == null || status.isBlank()) {
            status = "pending";
        }
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEstablishmentName() {
        return establishmentName;
    }

    public void setEstablishmentName(String establishmentName) {
        this.establishmentName = establishmentName;
    }

    public String getDocument() {
        return document;
    }

    public void setDocument(String document) {
        this.document = document;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getPrimaryColor() {
        return primaryColor;
    }

    public void setPrimaryColor(String primaryColor) {
        this.primaryColor = primaryColor;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public String getCampaignName() {
        return campaignName;
    }

    public void setCampaignName(String campaignName) {
        this.campaignName = campaignName;
    }

    public String getCampaignScope() {
        return campaignScope;
    }

    public void setCampaignScope(String campaignScope) {
        this.campaignScope = campaignScope;
    }

    public String getPlanCode() {
        return planCode;
    }

    public void setPlanCode(String planCode) {
        this.planCode = planCode;
    }

    public String getRequesterUserId() {
        return requesterUserId;
    }

    public void setRequesterUserId(String requesterUserId) {
        this.requesterUserId = requesterUserId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(String reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(Instant reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public String getCreatedEstablishmentId() {
        return createdEstablishmentId;
    }

    public void setCreatedEstablishmentId(String createdEstablishmentId) {
        this.createdEstablishmentId = createdEstablishmentId;
    }

    public String getCreatedSubscriptionId() {
        return createdSubscriptionId;
    }

    public void setCreatedSubscriptionId(String createdSubscriptionId) {
        this.createdSubscriptionId = createdSubscriptionId;
    }

    public String getCreatedCampaignId() {
        return createdCampaignId;
    }

    public void setCreatedCampaignId(String createdCampaignId) {
        this.createdCampaignId = createdCampaignId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
