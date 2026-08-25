package br.com.fiap.hackgov.infrastructure.repository;

import br.com.fiap.hackgov.domain.report.DailyOperationalReportProtocol;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;
import java.util.Collection;

public interface DailyOperationalReportProtocolRepository extends JpaRepository<DailyOperationalReportProtocol, UUID> {
    List<DailyOperationalReportProtocol> findByReportIdOrderByProtocolCreatedAtDesc(UUID reportId);
    List<DailyOperationalReportProtocol> findByReportIdAndStateCodeInOrderByProtocolCreatedAtDesc(
            UUID reportId, Collection<String> states);
}
