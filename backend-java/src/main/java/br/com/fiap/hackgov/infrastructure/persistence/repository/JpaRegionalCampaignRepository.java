package br.com.fiap.hackgov.infrastructure.persistence.repository;

import br.com.fiap.hackgov.domain.campaign.RegionalCampaign;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JpaRegionalCampaignRepository extends JpaRepository<RegionalCampaign, String> {

    @EntityGraph(attributePaths = "establishment")
    List<RegionalCampaign> findByStateIgnoreCaseAndStatusIgnoreCaseOrderByCreatedAtDesc(
            String state,
            String status
    );

    List<RegionalCampaign> findByEstablishmentIdAndStatusIgnoreCaseOrderByCreatedAtDesc(
            String establishmentId,
            String status
    );
}
