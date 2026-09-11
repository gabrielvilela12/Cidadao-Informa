package br.com.fiap.hackgov.infrastructure.repository;

import br.com.fiap.hackgov.domain.ai.AiChatCache;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface AiChatCacheRepository extends JpaRepository<AiChatCache, String> {

    Optional<AiChatCache> findFirstByEstablishmentIdAndNormalizedQuestionAndExpiresAtAfterOrderByCreatedAtDesc(
            String establishmentId,
            String normalizedQuestion,
            Instant now
    );

    List<AiChatCache> findByEstablishmentIdAndExpiresAtAfterOrderByCreatedAtDesc(
            String establishmentId,
            Instant now,
            Pageable pageable
    );
}
