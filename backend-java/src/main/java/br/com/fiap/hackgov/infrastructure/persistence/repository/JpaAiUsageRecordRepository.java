package br.com.fiap.hackgov.infrastructure.persistence.repository;

import br.com.fiap.hackgov.domain.billing.AiUsageRecord;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface JpaAiUsageRecordRepository extends JpaRepository<AiUsageRecord, String> {
    List<AiUsageRecord> findByEstablishmentIdOrderByCreatedAtDesc(String establishmentId, Pageable pageable);
    List<AiUsageRecord> findByEstablishmentIdAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(
            String establishmentId,
            Instant createdAt
    );
}
