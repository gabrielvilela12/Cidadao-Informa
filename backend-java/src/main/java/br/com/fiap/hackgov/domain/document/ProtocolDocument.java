package br.com.fiap.hackgov.domain.document;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "protocol_documents")
public class ProtocolDocument {

    @Id
    private UUID id;

    @Column(name = "protocol_id", nullable = false)
    private String protocolId;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false)
    private ProtocolDocumentType documentType;

    @Column(nullable = false)
    private Integer version;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private JsonNode snapshot;

    @Column(name = "source_hash", nullable = false)
    private String sourceHash;

    @Column(name = "snapshot_hash", nullable = false)
    private String snapshotHash;

    @Column(name = "generated_at", nullable = false)
    private Instant generatedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getProtocolId() { return protocolId; }
    public void setProtocolId(String protocolId) { this.protocolId = protocolId; }
    public ProtocolDocumentType getDocumentType() { return documentType; }
    public void setDocumentType(ProtocolDocumentType documentType) { this.documentType = documentType; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
    public JsonNode getSnapshot() { return snapshot; }
    public void setSnapshot(JsonNode snapshot) { this.snapshot = snapshot; }
    public String getSourceHash() { return sourceHash; }
    public void setSourceHash(String sourceHash) { this.sourceHash = sourceHash; }
    public String getSnapshotHash() { return snapshotHash; }
    public void setSnapshotHash(String snapshotHash) { this.snapshotHash = snapshotHash; }
    public Instant getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(Instant generatedAt) { this.generatedAt = generatedAt; }
}

