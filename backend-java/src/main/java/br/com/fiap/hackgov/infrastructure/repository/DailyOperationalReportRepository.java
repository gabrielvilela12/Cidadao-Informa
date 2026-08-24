package br.com.fiap.hackgov.infrastructure.repository;

import br.com.fiap.hackgov.domain.report.DailyOperationalReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DailyOperationalReportRepository extends JpaRepository<DailyOperationalReport, UUID> {
    Optional<DailyOperationalReport> findByReportDate(LocalDate reportDate);
    List<DailyOperationalReport> findAllByOrderByReportDateDesc();

    @Query(value = "select pg_advisory_xact_lock(hashtext(:lockKey))", nativeQuery = true)
    void lockGeneration(String lockKey);
}
