package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.application.dto.report.DailyReportDetailOutputDto;
import br.com.fiap.hackgov.application.dto.report.DailyReportSummaryOutputDto;
import br.com.fiap.hackgov.domain.audit.ProtocolAuditBlock;
import br.com.fiap.hackgov.domain.report.DailyOperationalReport;
import br.com.fiap.hackgov.domain.report.DailyOperationalReportProtocol;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaProtocolRepository;
import br.com.fiap.hackgov.infrastructure.repository.DailyOperationalReportProtocolRepository;
import br.com.fiap.hackgov.infrastructure.repository.DailyOperationalReportRepository;
import br.com.fiap.hackgov.infrastructure.repository.ProtocolAuditRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.*;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class DailyOperationalReportService {
    private static final ZoneId REPORT_ZONE = ZoneId.of("America/Sao_Paulo");
    private static final Pattern NEIGHBORHOOD = Pattern.compile("\\s-\\s([^,]+),");

    private final JpaProtocolRepository protocolRepository;
    private final ProtocolAuditRepository auditRepository;
    private final DailyOperationalReportRepository reportRepository;
    private final DailyOperationalReportProtocolRepository detailRepository;
    private final ObjectMapper objectMapper;

    public DailyOperationalReportService(JpaProtocolRepository protocolRepository,
                                         ProtocolAuditRepository auditRepository,
                                         DailyOperationalReportRepository reportRepository,
                                         DailyOperationalReportProtocolRepository detailRepository,
                                         ObjectMapper objectMapper) {
        this.protocolRepository = protocolRepository;
        this.auditRepository = auditRepository;
        this.reportRepository = reportRepository;
        this.detailRepository = detailRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public DailyReportSummaryOutputDto generateYesterday() {
        return generate(LocalDate.now(REPORT_ZONE).minusDays(1));
    }

    @Transactional
    public DailyReportSummaryOutputDto generate(LocalDate date) {
        if (!date.isBefore(LocalDate.now(REPORT_ZONE))) {
            throw new IllegalArgumentException("Só é possível fechar dias já encerrados.");
        }
        reportRepository.lockGeneration("daily-report:" + date);
        Optional<DailyOperationalReport> existing = reportRepository.findByReportDate(date);
        if (existing.isPresent()) return DailyReportSummaryOutputDto.from(existing.get());

        Instant start = date.atStartOfDay(REPORT_ZONE).toInstant();
        Instant end = date.plusDays(1).atStartOfDay(REPORT_ZONE).toInstant();
        List<JpaProtocolRepository.DailyReportProtocolProjection> created =
                protocolRepository.findDailyReportDataCreatedBetween(start, end);
        List<ProtocolAuditBlock> audits = auditRepository
                .findByCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtAsc(start, end);

        Set<String> ids = new LinkedHashSet<>();
        created.forEach(item -> ids.add(item.getId()));
        audits.stream().filter(this::isOperationalEvent).forEach(item -> ids.add(item.getProtocolId()));

        Map<String, JpaProtocolRepository.DailyReportProtocolProjection> protocols = new LinkedHashMap<>();
        created.forEach(item -> protocols.put(item.getId(), item));
        if (!ids.isEmpty()) {
            protocolRepository.findDailyReportDataByIdIn(ids).forEach(item -> protocols.put(item.getId(), item));
        }

        List<ProtocolAuditBlock> statusChanges = audits.stream().filter(this::isStatusChange).toList();
        List<Map<String, Object>> transitionTotals = transitionTotals(statusChanges);
        List<Map<String, Object>> regions = regionTotals(created);
        Map<String, BigDecimal> dailyCosts = latestCostsByProtocol(audits);

        DailyOperationalReport report = new DailyOperationalReport();
        report.setId(UUID.randomUUID());
        report.setReportDate(date);
        report.setPeriodStart(start);
        report.setPeriodEnd(end);
        report.setNewProtocolsCount(created.size());
        report.setStatusChangesCount(statusChanges.size());
        report.setProtocolsInvolvedCount(protocols.size());
        report.setTotalSpent(dailyCosts.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add));
        report.setStatusTransitions(transitionTotals);
        report.setRegionDistribution(regions);
        report.setGeneratedAt(Instant.now());
        report.setSourceHash(sourceHash(created, audits));
        reportRepository.save(report);

        List<DailyOperationalReportProtocol> details = protocols.values().stream()
                .sorted(Comparator.comparing(JpaProtocolRepository.DailyReportProtocolProjection::getCreatedAt).reversed())
                .map(item -> detail(report.getId(), item, start, end, statusChanges, dailyCosts))
                .toList();
        detailRepository.saveAll(details);
        return DailyReportSummaryOutputDto.from(report);
    }

    @Transactional(readOnly = true)
    public List<DailyReportSummaryOutputDto> list() {
        return reportRepository.findAllByOrderByReportDateDesc().stream()
                .map(DailyReportSummaryOutputDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<DailyReportSummaryOutputDto> list(Set<String> allowedStates) {
        if (allowedStates.isEmpty()) return List.of();
        return reportRepository.findAllByOrderByReportDateDesc().stream()
                .map(report -> DailyReportDetailOutputDto.scoped(
                        report,
                        detailRepository.findByReportIdAndStateCodeInOrderByProtocolCreatedAtDesc(
                                report.getId(), allowedStates)))
                .filter(detail -> detail.protocolsInvolvedCount() > 0)
                .map(detail -> new DailyReportSummaryOutputDto(
                        detail.id(), detail.reportDate(), detail.generatedAt(), detail.newProtocolsCount(),
                        detail.statusChangesCount(), detail.protocolsInvolvedCount(), detail.totalSpent(),
                        detail.regionsCount()))
                .toList();
    }

    @Transactional(readOnly = true)
    public DailyReportDetailOutputDto detail(UUID id) {
        DailyOperationalReport report = reportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Relatório diário não encontrado."));
        return DailyReportDetailOutputDto.from(report,
                detailRepository.findByReportIdOrderByProtocolCreatedAtDesc(id));
    }

    @Transactional(readOnly = true)
    public DailyReportDetailOutputDto detail(UUID id, Set<String> allowedStates) {
        DailyOperationalReport report = reportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Relatório diário não encontrado."));
        List<DailyOperationalReportProtocol> details = allowedStates.isEmpty()
                ? List.of()
                : detailRepository.findByReportIdAndStateCodeInOrderByProtocolCreatedAtDesc(id, allowedStates);
        if (details.isEmpty()) {
            throw new IllegalArgumentException("Relatório sem protocolos nas UFs permitidas.");
        }
        return DailyReportDetailOutputDto.scoped(report, details);
    }

    private DailyOperationalReportProtocol detail(UUID reportId,
                                                    JpaProtocolRepository.DailyReportProtocolProjection protocol,
                                                    Instant start, Instant end,
                                                    List<ProtocolAuditBlock> statusChanges,
                                                    Map<String, BigDecimal> costs) {
        DailyOperationalReportProtocol item = new DailyOperationalReportProtocol();
        item.setId(UUID.randomUUID());
        item.setReportId(reportId);
        item.setProtocolId(protocol.getId());
        item.setCategory(protocol.getCategory());
        item.setAddress(protocol.getAddress());
        item.setStateCode(protocol.getStateCode());
        item.setRegion(region(protocol.getAddress()));
        item.setCurrentStatus(protocol.getStatus());
        item.setProtocolCreatedAt(protocol.getCreatedAt());
        item.setCreatedDuringPeriod(!protocol.getCreatedAt().isBefore(start) && protocol.getCreatedAt().isBefore(end));
        item.setResolutionCost(protocol.getResolutionCost());
        item.setSpentDuringPeriod(costs.getOrDefault(protocol.getId(), BigDecimal.ZERO));
        item.setStatusChanges(statusChanges.stream()
                .filter(change -> protocol.getId().equals(change.getProtocolId()))
                .map(change -> Map.<String, Object>of(
                        "fromStatus", Objects.toString(change.getPreviousStatus(), ""),
                        "toStatus", Objects.toString(change.getNewStatus(), ""),
                        "occurredAt", change.getCreatedAt().toString()))
                .toList());
        return item;
    }

    private boolean isOperationalEvent(ProtocolAuditBlock audit) {
        return isStatusChange(audit) || costFrom(audit).isPresent();
    }

    private boolean isStatusChange(ProtocolAuditBlock audit) {
        return "STATUS_CHANGED".equals(audit.getEventType())
                && audit.getPreviousStatus() != null && audit.getNewStatus() != null
                && !audit.getPreviousStatus().equals(audit.getNewStatus());
    }

    private List<Map<String, Object>> transitionTotals(List<ProtocolAuditBlock> changes) {
        Map<String, Long> totals = new TreeMap<>();
        changes.forEach(item -> totals.merge(item.getPreviousStatus() + "\u0000" + item.getNewStatus(), 1L, Long::sum));
        return totals.entrySet().stream().map(entry -> {
            String[] parts = entry.getKey().split("\u0000", -1);
            return Map.<String, Object>of("fromStatus", parts[0], "toStatus", parts[1], "count", entry.getValue());
        }).toList();
    }

    private List<Map<String, Object>> regionTotals(List<JpaProtocolRepository.DailyReportProtocolProjection> created) {
        Map<String, Long> totals = new HashMap<>();
        created.forEach(item -> totals.merge(region(item.getAddress()), 1L, Long::sum));
        return totals.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed().thenComparing(Map.Entry.comparingByKey()))
                .map(entry -> Map.<String, Object>of("region", entry.getKey(), "count", entry.getValue()))
                .toList();
    }

    private Map<String, BigDecimal> latestCostsByProtocol(List<ProtocolAuditBlock> audits) {
        Map<String, BigDecimal> costs = new LinkedHashMap<>();
        audits.forEach(audit -> costFrom(audit).ifPresent(cost -> costs.put(audit.getProtocolId(), cost)));
        return costs;
    }

    @SuppressWarnings("unchecked")
    private Optional<BigDecimal> costFrom(ProtocolAuditBlock audit) {
        Object rawEvidence = audit.getPayload() == null ? null : audit.getPayload().get("evidence");
        if (!(rawEvidence instanceof Map<?, ?> evidence)) return Optional.empty();
        Object raw = evidence.get("resolution_cost");
        if (raw == null) return Optional.empty();
        try { return Optional.of(new BigDecimal(raw.toString())); }
        catch (NumberFormatException ignored) { return Optional.empty(); }
    }

    private String region(String address) {
        if (address == null || address.isBlank()) return "Região não identificada";
        Matcher matcher = NEIGHBORHOOD.matcher(address);
        return matcher.find() ? matcher.group(1).trim() : "Região não identificada";
    }

    private String sourceHash(List<JpaProtocolRepository.DailyReportProtocolProjection> created,
                              List<ProtocolAuditBlock> audits) {
        List<String> source = new ArrayList<>();
        created.stream().map(item -> "P:" + item.getId() + ":" + item.getCreatedAt()).sorted().forEach(source::add);
        audits.stream().filter(this::isOperationalEvent)
                .map(item -> "A:" + item.getId() + ":" + item.getPayloadHash()).sorted().forEach(source::add);
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(objectMapper.writeValueAsString(source).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException | JsonProcessingException ex) {
            throw new IllegalStateException("Não foi possível assinar o fechamento diário.", ex);
        }
    }
}
