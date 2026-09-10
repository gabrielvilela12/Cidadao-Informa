package br.com.fiap.hackgov.infrastructure.persistence.repository;

import br.com.fiap.hackgov.domain.billing.SubscriptionPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface JpaSubscriptionPaymentRepository extends JpaRepository<SubscriptionPayment, String> {

    long countByStatusIgnoreCase(String status);

    @Query("""
            select sum(payment.amount)
              from SubscriptionPayment payment
             where lower(payment.status) in :statuses
            """)
    BigDecimal sumAmountByStatusIn(@Param("statuses") Collection<String> statuses);

    List<SubscriptionPayment> findBySubscriptionIdInOrderByDueDateDescCreatedAtDesc(Collection<String> subscriptionIds);

    List<SubscriptionPayment> findBySubscriptionIdInAndPurposeOrderByCreatedAtDesc(
            Collection<String> subscriptionIds,
            String purpose
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select payment from SubscriptionPayment payment where payment.id = :id and payment.purpose = :purpose")
    Optional<SubscriptionPayment> findByIdAndPurposeForUpdate(
            @Param("id") String id,
            @Param("purpose") String purpose
    );
}
