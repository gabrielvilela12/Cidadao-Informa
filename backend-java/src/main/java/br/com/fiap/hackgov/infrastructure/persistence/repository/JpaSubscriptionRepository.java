package br.com.fiap.hackgov.infrastructure.persistence.repository;

import br.com.fiap.hackgov.domain.billing.Subscription;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface JpaSubscriptionRepository extends JpaRepository<Subscription, String> {

    @EntityGraph(attributePaths = "establishment")
    List<Subscription> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "establishment")
    List<Subscription> findByEstablishmentIdOrderByCreatedAtDesc(String establishmentId);

    @EntityGraph(attributePaths = "establishment")
    Optional<Subscription> findFirstByEstablishmentIdOrderByCreatedAtDesc(String establishmentId);

    long countByStatusIgnoreCase(String status);

    @Query("""
            select count(subscription)
            from Subscription subscription
            where subscription.establishmentId = :establishmentId
              and lower(subscription.status) in :statuses
            """)
    long countEnabledByEstablishmentId(
            @Param("establishmentId") String establishmentId,
            @Param("statuses") Collection<String> statuses
    );
}
