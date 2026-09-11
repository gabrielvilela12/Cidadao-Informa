package br.com.fiap.hackgov.infrastructure.persistence.repository;

import br.com.fiap.hackgov.domain.billing.AiUsageRecord;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface JpaAiUsageRecordRepository extends JpaRepository<AiUsageRecord, String> {
    List<AiUsageRecord> findByEstablishmentIdOrderByCreatedAtDesc(String establishmentId, Pageable pageable);
    List<AiUsageRecord> findByEstablishmentIdAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(
            String establishmentId,
            Instant createdAt
    );

    long countByUserIdAndCreatedAtGreaterThanEqual(String userId, Instant createdAt);

    @Query("select coalesce(sum(record.totalTokens), 0) from AiUsageRecord record "
            + "where record.userId = :userId and record.createdAt >= :createdAt")
    Long sumTotalTokensByUserSince(@Param("userId") String userId, @Param("createdAt") Instant createdAt);
}
