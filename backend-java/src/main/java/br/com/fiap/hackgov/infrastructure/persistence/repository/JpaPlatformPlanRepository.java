package br.com.fiap.hackgov.infrastructure.persistence.repository;

import br.com.fiap.hackgov.domain.billing.PlatformPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JpaPlatformPlanRepository extends JpaRepository<PlatformPlan, String> {

    List<PlatformPlan> findByStatusIgnoreCaseOrderBySortOrderAscNameAsc(String status);
}
