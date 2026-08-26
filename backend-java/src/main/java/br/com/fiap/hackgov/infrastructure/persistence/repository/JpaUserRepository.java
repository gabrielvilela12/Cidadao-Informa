package br.com.fiap.hackgov.infrastructure.persistence.repository;

import br.com.fiap.hackgov.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.Optional;
import java.util.List;

public interface JpaUserRepository extends JpaRepository<User, String> {

    @EntityGraph(attributePaths = "establishment")
    Optional<User> findByCpf(String cpf);

    @EntityGraph(attributePaths = "establishment")
    Optional<User> findByEmail(String email);

    List<User> findAllByRoleIgnoreCaseOrderByCreatedAtDesc(String role);

    long countByRoleIgnoreCase(String role);

    long countByEstablishmentIdAndRoleIgnoreCase(String establishmentId, String role);

    @Override
    @EntityGraph(attributePaths = "establishment")
    Optional<User> findById(String id);
}
