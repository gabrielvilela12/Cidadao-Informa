package br.com.fiap.hackgov.infrastructure.persistence.repository;

import br.com.fiap.hackgov.domain.entity.UserResidenceProof;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JpaUserResidenceProofRepository extends JpaRepository<UserResidenceProof, String> {
}
