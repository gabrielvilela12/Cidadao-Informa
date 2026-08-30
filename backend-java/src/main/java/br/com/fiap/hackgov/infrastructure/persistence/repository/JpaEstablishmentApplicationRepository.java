package br.com.fiap.hackgov.infrastructure.persistence.repository;

import br.com.fiap.hackgov.domain.onboarding.EstablishmentApplication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JpaEstablishmentApplicationRepository extends JpaRepository<EstablishmentApplication, String> {

    List<EstablishmentApplication> findAllByOrderByCreatedAtDesc();

    long countByStatusIgnoreCase(String status);
}
