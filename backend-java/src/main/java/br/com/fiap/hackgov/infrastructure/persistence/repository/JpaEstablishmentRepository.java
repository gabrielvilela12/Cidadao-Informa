package br.com.fiap.hackgov.infrastructure.persistence.repository;

import br.com.fiap.hackgov.domain.entity.Establishment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JpaEstablishmentRepository extends JpaRepository<Establishment, String> {

    long countByStatusIgnoreCase(String status);
}
