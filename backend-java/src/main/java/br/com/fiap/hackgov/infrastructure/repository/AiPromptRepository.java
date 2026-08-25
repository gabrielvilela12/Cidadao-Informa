package br.com.fiap.hackgov.infrastructure.repository;

import br.com.fiap.hackgov.domain.ai.AiPrompt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiPromptRepository extends JpaRepository<AiPrompt, UUID> {
    List<AiPrompt> findAllByOrderByAgentKeyAsc();
    Optional<AiPrompt> findByAgentKey(String agentKey);
}
