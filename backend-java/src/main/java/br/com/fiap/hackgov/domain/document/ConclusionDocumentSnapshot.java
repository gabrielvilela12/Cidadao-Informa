package br.com.fiap.hackgov.domain.document;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ConclusionDocumentSnapshot(
        UUID documentId,
        int version,
        ProtocolDocumentType documentType,
        String protocolId,
        String category,
        String description,
        String address,
        String status,
        BigDecimal resolutionCost,
        String aiPriority,
        String correctionReport,
        Instant createdAt,
        Instant concludedAt,
        Instant generatedAt,
        String citizenName,
        String citizenEmail,
        String citizenCpf,
        String citizenPhone,
        String auditHash,
        String verificationUrl,
        String snapshotHash
) {
    public boolean isPublic() {
        return documentType == ProtocolDocumentType.CONCLUSION_PUBLIC;
    }

    public ConclusionDocumentSnapshot withSnapshotHash(String value) {
        return new ConclusionDocumentSnapshot(
                documentId, version, documentType, protocolId, category,
                description, address, status, resolutionCost, aiPriority,
                correctionReport, createdAt, concludedAt, generatedAt,
                citizenName, citizenEmail, citizenCpf, citizenPhone,
                auditHash, verificationUrl, value
        );
    }
}

