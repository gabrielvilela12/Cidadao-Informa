package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.domain.audit.ProtocolAuditBlock;
import br.com.fiap.hackgov.domain.document.ConclusionDocumentSnapshot;
import br.com.fiap.hackgov.domain.document.ProtocolDocument;
import br.com.fiap.hackgov.domain.document.ProtocolDocumentType;
import br.com.fiap.hackgov.domain.entity.Protocol;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaProtocolRepository;
import br.com.fiap.hackgov.infrastructure.repository.ProtocolAuditRepository;
import br.com.fiap.hackgov.infrastructure.repository.ProtocolDocumentRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class ProtocolDocumentService {

    private static final Set<String> COMPLETED_STATUSES = Set.of("Concluído", "Resolved", "Closed");

    private final JpaProtocolRepository protocolRepository;
    private final ProtocolDocumentRepository documentRepository;
    private final ProtocolAuditRepository auditRepository;
    private final ConclusionReportPdfService pdfService;
    private final ObjectMapper objectMapper;
    private final String publicBaseUrl;

    public ProtocolDocumentService(
            JpaProtocolRepository protocolRepository,
            ProtocolDocumentRepository documentRepository,
            ProtocolAuditRepository auditRepository,
            ConclusionReportPdfService pdfService,
            ObjectMapper objectMapper,
            @Value("${app.public-base-url}") String publicBaseUrl
    ) {
        this.protocolRepository = protocolRepository;
        this.documentRepository = documentRepository;
        this.auditRepository = auditRepository;
        this.pdfService = pdfService;
        this.objectMapper = objectMapper;
        this.publicBaseUrl = publicBaseUrl.replaceAll("/+$", "");
    }

    @Transactional
    public GenerationSummary generateAllCompleted() {
        int generated = 0;
        int unchanged = 0;
        int failed = 0;
        List<JpaProtocolRepository.ConclusionDocumentProjection> protocols =
                protocolRepository.findConclusionDocumentData(COMPLETED_STATUSES);

        for (JpaProtocolRepository.ConclusionDocumentProjection protocol : protocols) {
            GenerationSummary item = generateBoth(protocol);
            generated += item.generated();
            unchanged += item.unchanged();
        }
        return new GenerationSummary(protocols.size(), generated, unchanged, failed);
    }

    @Transactional
    public GenerationSummary generateForProtocol(String protocolId) {
        JpaProtocolRepository.ConclusionDocumentProjection protocol = protocolRepository
                .findConclusionDocumentDataById(protocolId)
                .orElseThrow(() -> new IllegalArgumentException("Protocolo não encontrado."));
        requireCompleted(protocol);
        GenerationSummary result = generateBoth(protocol);
        return new GenerationSummary(1, result.generated(), result.unchanged(), result.failed());
    }

    @Transactional
    public byte[] renderLatest(String protocolId, ProtocolDocumentType type) {
        generateForProtocol(protocolId);
        ProtocolDocument document = documentRepository
                .findFirstByProtocolIdAndDocumentTypeOrderByVersionDesc(protocolId, type)
                .orElseThrow(() -> new IllegalStateException("Documento de conclusão ainda não disponível."));
        ConclusionDocumentSnapshot snapshot = objectMapper.convertValue(
                document.getSnapshot(),
                ConclusionDocumentSnapshot.class
        );
        Protocol protocol = protocolRepository.findById(protocolId)
                .orElseThrow(() -> new IllegalArgumentException("Protocolo não encontrado."));
        return pdfService.render(snapshot, protocol.getImageUrls(), protocol.getCorrectedImageUrls());
    }

    private GenerationSummary generateBoth(JpaProtocolRepository.ConclusionDocumentProjection protocol) {
        requireCompleted(protocol);
        int generated = 0;
        int unchanged = 0;
        for (ProtocolDocumentType type : ProtocolDocumentType.values()) {
            if (generateOne(protocol, type)) generated++;
            else unchanged++;
        }
        return new GenerationSummary(1, generated, unchanged, 0);
    }

    private boolean generateOne(
            JpaProtocolRepository.ConclusionDocumentProjection protocol,
            ProtocolDocumentType type
    ) {
        documentRepository.acquireTransactionLock(protocol.getId() + ":" + type.name());
        String sourceHash = hashJson(sourcePayload(protocol, type));
        if (documentRepository.findByProtocolIdAndDocumentTypeAndSourceHash(
                protocol.getId(), type, sourceHash).isPresent()) {
            return false;
        }

        int version = documentRepository
                .findFirstByProtocolIdAndDocumentTypeOrderByVersionDesc(protocol.getId(), type)
                .map(existing -> existing.getVersion() + 1)
                .orElse(1);
        UUID documentId = UUID.randomUUID();
        Instant generatedAt = Instant.now();
        ProtocolAuditBlock latestAudit = auditRepository
                .findFirstByProtocolIdOrderByBlockIndexDesc(protocol.getId())
                .orElse(null);
        Instant concludedAt = auditRepository.findByProtocolIdOrderByBlockIndexAsc(protocol.getId()).stream()
                .filter(item -> COMPLETED_STATUSES.contains(item.getNewStatus()))
                .filter(item -> !COMPLETED_STATUSES.contains(item.getPreviousStatus()))
                .findFirst()
                .map(ProtocolAuditBlock::getCreatedAt)
                .orElse(generatedAt);

        boolean isPublic = type == ProtocolDocumentType.CONCLUSION_PUBLIC;
        ConclusionDocumentSnapshot unhashed = new ConclusionDocumentSnapshot(
                documentId,
                version,
                type,
                protocol.getId(),
                protocol.getCategory(),
                protocol.getDescription(),
                protocol.getAddress(),
                protocol.getStatus(),
                protocol.getResolutionCost(),
                protocol.getAiPriority(),
                protocol.getCorrectionReport(),
                protocol.getCreatedAt(),
                concludedAt,
                generatedAt,
                isPublic ? null : protocol.getCitizenName(),
                isPublic ? null : protocol.getCitizenEmail(),
                isPublic ? null : protocol.getCitizenCpf(),
                isPublic ? null : protocol.getCitizenPhone(),
                latestAudit == null ? null : latestAudit.getBlockHash(),
                publicBaseUrl + "/p/" + protocol.getId(),
                null
        );
        String snapshotHash = hashJson(unhashed);
        ConclusionDocumentSnapshot snapshot = unhashed.withSnapshotHash(snapshotHash);

        ProtocolDocument document = new ProtocolDocument();
        document.setId(documentId);
        document.setProtocolId(protocol.getId());
        document.setDocumentType(type);
        document.setVersion(version);
        document.setSnapshot(objectMapper.valueToTree(snapshot));
        document.setSourceHash(sourceHash);
        document.setSnapshotHash(snapshotHash);
        document.setGeneratedAt(generatedAt);
        documentRepository.saveAndFlush(document);
        return true;
    }

    private Map<String, Object> sourcePayload(
            JpaProtocolRepository.ConclusionDocumentProjection p,
            ProtocolDocumentType type
    ) {
        Map<String, Object> source = new LinkedHashMap<>();
        source.put("type", type.name());
        source.put("protocolId", p.getId());
        source.put("category", p.getCategory());
        source.put("description", p.getDescription());
        source.put("address", p.getAddress());
        source.put("createdAt", p.getCreatedAt());
        source.put("status", p.getStatus());
        source.put("resolutionCost", p.getResolutionCost());
        source.put("aiPriority", p.getAiPriority());
        source.put("correctionReport", p.getCorrectionReport());
        ProtocolAuditBlock latestAudit = auditRepository
                .findFirstByProtocolIdOrderByBlockIndexDesc(p.getId())
                .orElse(null);
        source.put("auditHash", latestAudit == null ? null : latestAudit.getBlockHash());
        if (type == ProtocolDocumentType.CONCLUSION_INTERNAL) {
            source.put("citizenName", p.getCitizenName());
            source.put("citizenEmail", p.getCitizenEmail());
            source.put("citizenCpf", p.getCitizenCpf());
            source.put("citizenPhone", p.getCitizenPhone());
        }
        return source;
    }

    private String hashJson(Object value) {
        try {
            JsonNode tree = objectMapper.valueToTree(value);
            byte[] content = objectMapper.writeValueAsBytes(tree);
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(content);
            return HexFormat.of().formatHex(hash);
        } catch (Exception exception) {
            throw new IllegalStateException("Não foi possível calcular a integridade do documento.", exception);
        }
    }

    private void requireCompleted(JpaProtocolRepository.ConclusionDocumentProjection protocol) {
        if (!COMPLETED_STATUSES.contains(protocol.getStatus())) {
            throw new IllegalArgumentException("O relatório só fica disponível após a conclusão do protocolo.");
        }
    }

    public record GenerationSummary(int protocols, int generated, int unchanged, int failed) {}
}
