package br.com.fiap.hackgov.infrastructure.persistence.repository;

import br.com.fiap.hackgov.domain.billing.AiCreditWallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface JpaAiCreditWalletRepository extends JpaRepository<AiCreditWallet, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select wallet from AiCreditWallet wallet where wallet.establishmentId = :establishmentId")
    Optional<AiCreditWallet> findByEstablishmentIdForUpdate(@Param("establishmentId") String establishmentId);
}
