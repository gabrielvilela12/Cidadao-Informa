package br.com.fiap.hackgov.infrastructure.repository;

import br.com.fiap.hackgov.domain.ai.AiPriorityJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiPriorityJobRepository extends JpaRepository<AiPriorityJob, UUID> {
    Optional<AiPriorityJob> findByProtocolId(UUID protocolId);

    @Query("SELECT j FROM AiPriorityJob j WHERE j.status IN ('pending', 'failed') " +
           "AND j.attemptCount < 3 " +
           "AND j.createdAt > :cutoffTime " +
           "ORDER BY j.createdAt ASC")
    List<AiPriorityJob> findFailedJobsForRetry(@Param("cutoffTime") LocalDateTime cutoffTime);

    @Query("SELECT j FROM AiPriorityJob j WHERE j.status = :status ORDER BY j.createdAt DESC")
    List<AiPriorityJob> findByStatus(@Param("status") String status);
}
