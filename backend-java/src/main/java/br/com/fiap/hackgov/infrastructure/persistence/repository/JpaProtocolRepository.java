package br.com.fiap.hackgov.infrastructure.persistence.repository;

import br.com.fiap.hackgov.domain.entity.Protocol;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JpaProtocolRepository extends JpaRepository<Protocol, String> {

    @EntityGraph(attributePaths = "user")
    List<Protocol> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "user")
    List<Protocol> findByUserIdOrderByCreatedAtDesc(String userId);

    @Override
    @EntityGraph(attributePaths = "user")
    Optional<Protocol> findById(String id);
}
