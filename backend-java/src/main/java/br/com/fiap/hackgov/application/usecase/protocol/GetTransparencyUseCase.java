package br.com.fiap.hackgov.application.usecase.protocol;

import br.com.fiap.hackgov.application.dto.protocol.TransparencyOutputDto;
import br.com.fiap.hackgov.application.service.ProtocolAuditService;
import br.com.fiap.hackgov.domain.repository.ProtocolRepository;
import br.com.fiap.hackgov.domain.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.Duration;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class GetTransparencyUseCase {

    private static final int RECENT_PROTOCOL_LIMIT = 20;
    private static final double PUBLIC_GRID_SIZE = 0.25;
    private static final String AI_MODEL = "google/gemini-3.7-flash";

    private final ProtocolRepository protocolRepository;
    private final UserRepository userRepository;
    private final ProtocolAuditService auditService;

    public GetTransparencyUseCase(
            ProtocolRepository protocolRepository,
            UserRepository userRepository,
            ProtocolAuditService auditService
    ) {
        this.protocolRepository = protocolRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public TransparencyOutputDto execute() {
        Instant generatedAt = Instant.now();
        List<ProtocolRepository.TransparencyProtocol> protocols = protocolRepository.getTransparencyData();

        long completed = protocols.stream().filter(this::isCompleted).count();
        long open = protocols.stream().filter(item -> normalizeStatus(item.status()).equals("Aberto")).count();
        long inAnalysis = protocols.stream().filter(item -> normalizeStatus(item.status()).equals("Em análise")).count();
        long total = protocols.size();
        Integer resolutionRate = percentage(completed, total);

        List<TransparencyOutputDto.Metric> statuses = metrics(
                protocols,
                item -> normalizeStatus(item.status()),
                List.of("Aberto", "Em análise", "Concluído", "Atrasado", "Outros")
        );
        List<TransparencyOutputDto.Metric> categories = metrics(
                protocols,
                item -> readable(item.category(), "Outros"),
                List.of("Física", "Visual", "Auditiva", "Outros")
        );
        List<TransparencyOutputDto.Metric> priorities = metrics(
                protocols,
                item -> normalizePriority(item.aiPriority()),
                List.of("Crítica", "Alta", "Média", "Baixa", "Não classificada")
        );

        TransparencyOutputDto.SlaSummary sla = calculateSla(protocols, generatedAt);
        long classified = protocols.stream().filter(item -> hasText(item.aiPriority())).count();
        long pending = protocols.stream().filter(item -> "pending".equalsIgnoreCase(item.aiStatus())).count();
        long failed = protocols.stream().filter(item -> "failed".equalsIgnoreCase(item.aiStatus())).count();
        long withCoordinates = protocols.stream().filter(this::hasCoordinates).count();

        ProtocolAuditService.AuditVerificationDto verification = auditService.verifyAll();

        return new TransparencyOutputDto(
                generatedAt,
                new TransparencyOutputDto.Overview(
                        total,
                        open,
                        inAnalysis,
                        completed,
                        userRepository.countByRole("citizen"),
                        resolutionRate
                ),
                statuses,
                categories,
                priorities,
                monthlyEvolution(protocols, generatedAt),
                sla,
                new TransparencyOutputDto.AiSummary(
                        total,
                        classified,
                        pending,
                        failed,
                        percentage(classified, total),
                        AI_MODEL
                ),
                new TransparencyOutputDto.DataQuality(
                        withCoordinates,
                        total - withCoordinates,
                        classified,
                        total - classified
                ),
                new TransparencyOutputDto.AuditSummary(
                        verification.valid(),
                        verification.totalBlocks(),
                        generatedAt
                ),
                geography(protocols),
                recentProtocols(protocols)
        );
    }

    private List<TransparencyOutputDto.MonthlyPoint> monthlyEvolution(
            List<ProtocolRepository.TransparencyProtocol> protocols,
            Instant now
    ) {
        YearMonth current = YearMonth.from(now.atZone(ZoneOffset.UTC));
        List<TransparencyOutputDto.MonthlyPoint> result = new ArrayList<>();
        for (int offset = 11; offset >= 0; offset--) {
            YearMonth month = current.minusMonths(offset);
            long registered = protocols.stream().filter(item -> monthOf(item).equals(month)).count();
            long resolved = protocols.stream()
                    .filter(item -> monthOf(item).equals(month) && isCompleted(item))
                    .count();
            result.add(new TransparencyOutputDto.MonthlyPoint(month.toString(), registered, resolved));
        }
        return result;
    }

    private TransparencyOutputDto.SlaSummary calculateSla(
            List<ProtocolRepository.TransparencyProtocol> protocols,
            Instant now
    ) {
        List<ProtocolRepository.TransparencyProtocol> active = protocols.stream()
                .filter(item -> !isCompleted(item))
                .toList();
        long late = 0;
        long dueSoon = 0;
        long onTime = 0;

        for (ProtocolRepository.TransparencyProtocol item : active) {
            long deadlineHours = deadlineHours(item.aiPriority());
            Instant deadline = item.createdAt().plus(Duration.ofHours(deadlineHours));
            if (now.isAfter(deadline)) {
                late++;
                continue;
            }
            long totalMinutes = Duration.ofHours(deadlineHours).toMinutes();
            long remainingMinutes = Duration.between(now, deadline).toMinutes();
            if (remainingMinutes <= Math.round(totalMinutes * 0.20)) {
                dueSoon++;
            } else {
                onTime++;
            }
        }

        return new TransparencyOutputDto.SlaSummary(
                active.size(),
                onTime,
                dueSoon,
                late,
                percentage(onTime + dueSoon, active.size())
        );
    }

    private List<TransparencyOutputDto.GeoCluster> geography(
            List<ProtocolRepository.TransparencyProtocol> protocols
    ) {
        return protocols.stream()
                .filter(this::hasCoordinates)
                .collect(Collectors.groupingBy(
                        item -> new GridPoint(
                                roundToGrid(item.latitude()),
                                roundToGrid(item.longitude())
                        ),
                        Collectors.counting()
                ))
                .entrySet()
                .stream()
                .map(entry -> new TransparencyOutputDto.GeoCluster(
                        entry.getKey().latitude(),
                        entry.getKey().longitude(),
                        entry.getValue()
                ))
                .sorted(Comparator.comparingLong(TransparencyOutputDto.GeoCluster::count).reversed())
                .limit(100)
                .toList();
    }

    private List<TransparencyOutputDto.RecentProtocol> recentProtocols(
            List<ProtocolRepository.TransparencyProtocol> protocols
    ) {
        return protocols.stream()
                .limit(RECENT_PROTOCOL_LIMIT)
                .map(item -> new TransparencyOutputDto.RecentProtocol(
                        shortId(item.id()),
                        readable(item.category(), "Outros"),
                        publicLocation(item.address()),
                        item.createdAt(),
                        normalizeStatus(item.status()),
                        normalizePriority(item.aiPriority())
                ))
                .toList();
    }

    private List<TransparencyOutputDto.Metric> metrics(
            List<ProtocolRepository.TransparencyProtocol> protocols,
            Function<ProtocolRepository.TransparencyProtocol, String> classifier,
            List<String> preferredOrder
    ) {
        Map<String, Long> counts = protocols.stream()
                .collect(Collectors.groupingBy(classifier, Collectors.counting()));
        Map<String, Long> ordered = new LinkedHashMap<>();
        preferredOrder.forEach(label -> {
            if (counts.containsKey(label)) ordered.put(label, counts.remove(label));
        });
        counts.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .forEach(entry -> ordered.put(entry.getKey(), entry.getValue()));
        return ordered.entrySet().stream()
                .map(entry -> new TransparencyOutputDto.Metric(entry.getKey(), entry.getValue()))
                .toList();
    }

    private YearMonth monthOf(ProtocolRepository.TransparencyProtocol item) {
        return YearMonth.from(item.createdAt().atZone(ZoneOffset.UTC));
    }

    private boolean isCompleted(ProtocolRepository.TransparencyProtocol item) {
        return normalizeStatus(item.status()).equals("Concluído");
    }

    private boolean hasCoordinates(ProtocolRepository.TransparencyProtocol item) {
        return item.latitude() != null && item.longitude() != null;
    }

    private String normalizeStatus(String value) {
        String normalized = normalizedKey(value);
        if (normalized.contains("conclu") || normalized.equals("resolved") || normalized.equals("closed")) {
            return "Concluído";
        }
        if (normalized.contains("analise") || normalized.contains("andamento")) {
            return "Em análise";
        }
        if (normalized.equals("aberto") || normalized.equals("open")) {
            return "Aberto";
        }
        if (normalized.equals("atrasado") || normalized.equals("late")) {
            return "Atrasado";
        }
        return "Outros";
    }

    private String normalizePriority(String value) {
        return switch (normalizedKey(value)) {
            case "critica", "critical" -> "Crítica";
            case "alta", "high" -> "Alta";
            case "media", "medium" -> "Média";
            case "baixa", "low" -> "Baixa";
            default -> "Não classificada";
        };
    }

    private long deadlineHours(String priority) {
        return switch (normalizedKey(priority)) {
            case "critica", "critical" -> 48;
            case "alta", "high" -> 120;
            case "baixa", "low" -> 720;
            default -> 360;
        };
    }

    private String publicLocation(String address) {
        if (!hasText(address)) return "Localização não divulgada";
        String[] commaParts = address.split(",");
        String tail = commaParts[commaParts.length - 1].trim();
        if (tail.matches(".*\\b[A-Za-zÀ-ÿ .'-]+\\s*[-/]\\s*[A-Za-z]{2}$")) {
            return tail.replaceAll("\\s*/\\s*", " - ");
        }
        return "Localização agregada";
    }

    private String shortId(String id) {
        if (!hasText(id)) return "indisponível";
        return id.substring(0, Math.min(8, id.length()));
    }

    private String readable(String value, String fallback) {
        return hasText(value) ? value.trim() : fallback;
    }

    private String normalizedKey(String value) {
        if (!hasText(value)) return "";
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .trim();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private Integer percentage(long numerator, long denominator) {
        return denominator == 0 ? null : (int) Math.round((numerator * 100.0) / denominator);
    }

    private double roundToGrid(double value) {
        return Math.round(value / PUBLIC_GRID_SIZE) * PUBLIC_GRID_SIZE;
    }

    private record GridPoint(double latitude, double longitude) {
    }
}
