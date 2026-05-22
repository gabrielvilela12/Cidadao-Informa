package br.com.fiap.hackgov.infrastructure.repository;

import br.com.fiap.hackgov.domain.ai.AiJobLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AiJobLogRepository extends JpaRepository<AiJobLog, UUID> {
    List<AiJobLog> findByProtocolId(String protocolId);

    @Query("SELECT l FROM AiJobLog l WHERE l.createdAt >= :startDate ORDER BY l.createdAt DESC")
    List<AiJobLog> findRecent(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT l FROM AiJobLog l WHERE l.source = :source AND l.createdAt >= :startDate")
    List<AiJobLog> findBySourceAndDate(@Param("source") String source, @Param("startDate") LocalDateTime startDate);
}
