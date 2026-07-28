package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.domain.audit.ProtocolAuditBlock;
import br.com.fiap.hackgov.infrastructure.repository.ProtocolAuditRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

@Service
public class ProtocolAuditService {

    private final ProtocolAuditRepository repository;
    private final ObjectMapper objectMapper;

    public ProtocolAuditService(
            ProtocolAuditRepository repository,
            ObjectMapper objectMapper
    ) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public synchronized void append(
            String protocolId,
            String eventType,
            String actorId,
            String actorRole,
            String previousStatus,
            String newStatus,
            Map<String, Object> evidence
    ) {
        ProtocolAuditBlock previousBlock = repository
                .findFirstByOrderByBlockIndexDesc()
                .orElse(null);
        long blockIndex = previousBlock == null ? 1 : previousBlock.getBlockIndex() + 1;
        String previousBlockHash = previousBlock == null ? null : previousBlock.getBlockHash();
        Instant occurredAt = Instant.now();

        Map<String, Object> payload = new TreeMap<>();
        payload.put("protocol_id", protocolId);
        payload.put("event_type", eventType);
        payload.put("actor_id", actorId);
        payload.put("actor_role", normalizeRole(actorRole));
        payload.put("previous_status", previousStatus);
        payload.put("new_status", newStatus);
        payload.put("occurred_at", occurredAt.toString());
        payload.put("evidence", evidence == null ? Map.of() : evidence);

        String payloadHash = sha256(canonicalJson(payload));
        Map<String, Object> blockPayload = new TreeMap<>();
        blockPayload.put("block_index", blockIndex);
        blockPayload.put("payload_hash", payloadHash);
        blockPayload.put("previous_block_hash", previousBlockHash);

        ProtocolAuditBlock block = new ProtocolAuditBlock();
        block.setId(UUID.randomUUID());
        block.setBlockIndex(blockIndex);
        block.setProtocolId(protocolId);
        block.setEventType(eventType);
        block.setActorId(actorId);
        block.setActorRole(normalizeRole(actorRole));
        block.setPreviousStatus(previousStatus);
        block.setNewStatus(newStatus);
        block.setPayload(payload);
        block.setPayloadHash(payloadHash);
        block.setPreviousBlockHash(previousBlockHash);
        block.setBlockHash(sha256(canonicalJson(blockPayload)));
        block.setCreatedAt(occurredAt);
        repository.save(block);
    }

    @Transactional(readOnly = true)
    public AuditTrailDto getProtocolTrail(String protocolId) {
        List<AuditBlockDto> blocks = repository
                .findByProtocolIdOrderByBlockIndexAsc(protocolId)
                .stream()
                .map(block -> toDto(block, verifyBlock(block)))
                .toList();
        return new AuditTrailDto(
                blocks.stream().allMatch(AuditBlockDto::valid),
                blocks
        );
    }

    @Transactional(readOnly = true)
    public AuditVerificationDto verifyAll() {
        List<ProtocolAuditBlock> blocks = repository.findAllByOrderByBlockIndexAsc();
        String previousHash = null;

        for (int index = 0; index < blocks.size(); index++) {
            ProtocolAuditBlock block = blocks.get(index);
            long expectedIndex = index + 1L;
            boolean valid = block.getBlockIndex() == expectedIndex
                    && java.util.Objects.equals(block.getPreviousBlockHash(), previousHash)
                    && verifyBlock(block);
            if (!valid) {
                return new AuditVerificationDto(
                        false,
                        blocks.size(),
                        block.getBlockIndex(),
                        block.getBlockHash(),
                        null
                );
            }
            previousHash = block.getBlockHash();
        }

        return new AuditVerificationDto(true, blocks.size(), null, null, previousHash);
    }

    private boolean verifyBlock(ProtocolAuditBlock block) {
        String expectedPayloadHash = sha256(canonicalJson(block.getPayload()));
        Map<String, Object> blockPayload = new TreeMap<>();
        blockPayload.put("block_index", block.getBlockIndex());
        blockPayload.put("payload_hash", block.getPayloadHash());
        blockPayload.put("previous_block_hash", block.getPreviousBlockHash());
        String expectedBlockHash = sha256(canonicalJson(blockPayload));

        return expectedPayloadHash.equals(block.getPayloadHash())
                && expectedBlockHash.equals(block.getBlockHash());
    }

    private AuditBlockDto toDto(ProtocolAuditBlock block, boolean valid) {
        return new AuditBlockDto(
                block.getId(),
                block.getBlockIndex(),
                block.getProtocolId(),
                block.getEventType(),
                block.getActorId(),
                block.getActorRole(),
                block.getPreviousStatus(),
                block.getNewStatus(),
                block.getPayloadHash(),
                block.getPreviousBlockHash(),
                block.getBlockHash(),
                block.getCreatedAt(),
                valid
        );
    }

    private String canonicalJson(Object value) {
        try {
            return objectMapper.writeValueAsString(sortNode(objectMapper.valueToTree(value)));
        } catch (Exception exception) {
            throw new IllegalStateException("Não foi possível gerar o hash de auditoria.", exception);
        }
    }

    private JsonNode sortNode(JsonNode node) {
        if (node.isObject()) {
            ObjectNode sorted = objectMapper.createObjectNode();
            List<Map.Entry<String, JsonNode>> fields = new ArrayList<>();
            node.fields().forEachRemaining(fields::add);
            fields.stream()
                    .sorted(Comparator.comparing(Map.Entry::getKey))
                    .forEach(entry -> sorted.set(entry.getKey(), sortNode(entry.getValue())));
            return sorted;
        }

        if (node.isArray()) {
            ArrayNode sorted = objectMapper.createArrayNode();
            node.forEach(item -> sorted.add(sortNode(item)));
            return sorted;
        }

        return node;
    }

    private String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder(digest.length * 2);
            for (byte item : digest) {
                result.append(String.format("%02x", item));
            }
            return result.toString();
        } catch (Exception exception) {
            throw new IllegalStateException("SHA-256 não está disponível.", exception);
        }
    }

    public String hashValue(String value) {
        return sha256(value == null ? "" : value);
    }

    private String normalizeRole(String role) {
        return switch (role) {
            case "admin", "system", "ia" -> role;
            default -> "citizen";
        };
    }

    public record AuditBlockDto(
            UUID id,
            Long blockIndex,
            String protocolId,
            String eventType,
            String actorId,
            String actorRole,
            String previousStatus,
            String newStatus,
            String payloadHash,
            String previousBlockHash,
            String blockHash,
            Instant createdAt,
            boolean valid
    ) {
    }

    public record AuditTrailDto(boolean valid, List<AuditBlockDto> blocks) {
    }

    public record AuditVerificationDto(
            boolean valid,
            int totalBlocks,
            Long invalidBlockIndex,
            String invalidBlockHash,
            String latestBlockHash
    ) {
    }
}
