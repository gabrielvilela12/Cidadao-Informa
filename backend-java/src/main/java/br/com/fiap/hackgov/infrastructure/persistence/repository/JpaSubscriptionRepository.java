package br.com.fiap.hackgov.infrastructure.persistence.repository;

import br.com.fiap.hackgov.domain.billing.Subscription;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JpaSubscriptionRepository extends JpaRepository<Subscription, String> {

    @EntityGraph(attributePaths = "establishment")
    List<Subscription> findAllByOrderByCreatedAtDesc();

    long countByStatusIgnoreCase(String status);
}
