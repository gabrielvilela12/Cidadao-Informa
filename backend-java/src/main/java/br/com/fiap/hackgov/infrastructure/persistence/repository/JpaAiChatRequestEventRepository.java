package br.com.fiap.hackgov.infrastructure.persistence.repository;

import br.com.fiap.hackgov.domain.ai.AiChatRequestEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface JpaAiChatRequestEventRepository extends JpaRepository<AiChatRequestEvent, String> {

    @Query(value = "select 1 from pg_advisory_xact_lock(hashtext(:userId))", nativeQuery = true)
    Integer lockByUserId(@Param("userId") String userId);

    long countByUserIdAndCreatedAtGreaterThanEqual(String userId, Instant createdAt);
}
