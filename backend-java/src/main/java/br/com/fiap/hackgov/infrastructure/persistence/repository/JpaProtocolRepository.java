package br.com.fiap.hackgov.infrastructure.persistence.repository;

import br.com.fiap.hackgov.domain.entity.Protocol;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface JpaProtocolRepository extends JpaRepository<Protocol, String> {

    @EntityGraph(attributePaths = "user")
    List<Protocol> findAllByOrderByCreatedAtDesc();

    // Fila da geocodificacao: chamados que ainda nao tem posicao no mapa.
    List<Protocol> findByLatitudeIsNullOrderByCreatedAtDesc(Pageable pageable);

    long countByLatitudeIsNull();

    @EntityGraph(attributePaths = "user")
    List<Protocol> findByUserIdOrderByCreatedAtDesc(String userId);

    long countByStatusIn(Collection<String> statuses);

    @Override
    @EntityGraph(attributePaths = "user")
    Optional<Protocol> findById(String id);
}
