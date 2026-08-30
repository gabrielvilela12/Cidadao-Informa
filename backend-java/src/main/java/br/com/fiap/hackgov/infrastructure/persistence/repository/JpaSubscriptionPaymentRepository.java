package br.com.fiap.hackgov.infrastructure.persistence.repository;

import br.com.fiap.hackgov.domain.billing.SubscriptionPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;

public interface JpaSubscriptionPaymentRepository extends JpaRepository<SubscriptionPayment, String> {

    long countByStatusIgnoreCase(String status);

    @Query("""
            select sum(payment.amount)
              from SubscriptionPayment payment
             where lower(payment.status) in :statuses
            """)
    BigDecimal sumAmountByStatusIn(@Param("statuses") Collection<String> statuses);

    List<SubscriptionPayment> findBySubscriptionIdInOrderByDueDateDescCreatedAtDesc(Collection<String> subscriptionIds);
}
