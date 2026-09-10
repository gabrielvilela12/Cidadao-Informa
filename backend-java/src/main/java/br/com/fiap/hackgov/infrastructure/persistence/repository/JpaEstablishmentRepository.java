package br.com.fiap.hackgov.infrastructure.persistence.repository;

import br.com.fiap.hackgov.domain.entity.Establishment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JpaEstablishmentRepository extends JpaRepository<Establishment, String> {

    long countByStatusIgnoreCase(String status);

    List<Establishment> findByStateIgnoreCaseAndStatusIgnoreCaseOrderByCreatedAtDesc(
            String state,
            String status
    );
}
