package br.com.fiap.hackgov.infrastructure.persistence.repository;

import br.com.fiap.hackgov.domain.billing.AiCreditTransaction;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JpaAiCreditTransactionRepository extends JpaRepository<AiCreditTransaction, String> {
    List<AiCreditTransaction> findByEstablishmentIdOrderByCreatedAtDesc(String establishmentId, Pageable pageable);
    Optional<AiCreditTransaction> findByReferenceIdAndTypeAndStatus(
            String referenceId,
            String type,
            String status
    );
}
