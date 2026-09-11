package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.application.service.ChatAssistantService.ChatRequest;
import br.com.fiap.hackgov.application.service.ChatAssistantService.ChatResponse;
import br.com.fiap.hackgov.domain.ai.AiChatCache;
import br.com.fiap.hackgov.infrastructure.repository.AiChatCacheRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class ChatCacheService {

    private static final int VECTOR_SIZE = 192;
    private static final int MAX_CACHEABLE_MESSAGE_LENGTH = 500;
    private static final int MAX_CACHEABLE_REPLY_LENGTH = 5_000;
    private static final Pattern EMAIL_PATTERN = Pattern.compile("\\b[\\w.%+-]+@[\\w.-]+\\.[a-z]{2,}\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern CPF_PATTERN = Pattern.compile("\\b\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}\\b");
    private static final Pattern SPECIFIC_NUMBER_PATTERN = Pattern.compile("\\b#?\\d{4,}\\b");
    private static final Set<String> STOP_WORDS = Set.of(
            "a", "ao", "aos", "as", "com", "como", "da", "das", "de", "do", "dos",
            "e", "em", "eu", "me", "minha", "meu", "na", "nas", "no", "nos",
            "o", "os", "ou", "para", "pra", "por", "que", "um", "uma"
    );
    private static final Set<String> CONTEXTUAL_WORDS = Set.of(
            "aqui", "isso", "isto", "essa", "esse", "esta", "este", "nessa", "nesse",
            "nesta", "neste", "anterior", "acima", "abaixo"
    );
    private static final Set<String> DOMAIN_INTENTS = Set.of(
            "solicitacao", "buraco", "iluminacao", "poda", "lixo", "drenagem",
            "calcada", "acompanhamento", "mapa", "transparencia", "acessibilidade"
    );
    private static final Map<String, String> CANONICAL_TOKENS = Map.ofEntries(
            Map.entry("abrir", "solicitacao"),
            Map.entry("abre", "solicitacao"),
            Map.entry("abro", "solicitacao"),
            Map.entry("chamado", "solicitacao"),
            Map.entry("chamados", "solicitacao"),
            Map.entry("denunciar", "solicitacao"),
            Map.entry("denuncia", "solicitacao"),
            Map.entry("fazer", "solicitacao"),
            Map.entry("faco", "solicitacao"),
            Map.entry("pedir", "solicitacao"),
            Map.entry("pedido", "solicitacao"),
            Map.entry("relatar", "solicitacao"),
            Map.entry("reclamar", "solicitacao"),
            Map.entry("solicitar", "solicitacao"),
            Map.entry("solicitacao", "solicitacao"),
            Map.entry("buraco", "buraco"),
            Map.entry("buracos", "buraco"),
            Map.entry("esburacada", "buraco"),
            Map.entry("esburacadas", "buraco"),
            Map.entry("esburacado", "buraco"),
            Map.entry("asfalto", "buraco"),
            Map.entry("pavimento", "buraco"),
            Map.entry("lampada", "iluminacao"),
            Map.entry("lampadas", "iluminacao"),
            Map.entry("iluminacao", "iluminacao"),
            Map.entry("luz", "iluminacao"),
            Map.entry("poste", "iluminacao"),
            Map.entry("postes", "iluminacao"),
            Map.entry("escuro", "iluminacao"),
            Map.entry("arvore", "poda"),
            Map.entry("arvores", "poda"),
            Map.entry("galho", "poda"),
            Map.entry("poda", "poda"),
            Map.entry("lixo", "lixo"),
            Map.entry("entulho", "lixo"),
            Map.entry("descarte", "lixo"),
            Map.entry("bueiro", "drenagem"),
            Map.entry("bueiros", "drenagem"),
            Map.entry("alagamento", "drenagem"),
            Map.entry("enchente", "drenagem"),
            Map.entry("esgoto", "drenagem"),
            Map.entry("calcada", "calcada"),
            Map.entry("calcadas", "calcada"),
            Map.entry("rampa", "acessibilidade"),
            Map.entry("acessibilidade", "acessibilidade"),
            Map.entry("acompanhar", "acompanhamento"),
            Map.entry("andamento", "acompanhamento"),
            Map.entry("protocolo", "acompanhamento"),
            Map.entry("status", "acompanhamento"),
            Map.entry("mapa", "mapa"),
            Map.entry("transparencia", "transparencia"),
            Map.entry("gastos", "transparencia"),
            Map.entry("obra", "transparencia"),
            Map.entry("obras", "transparencia")
    );

    private final AiChatCacheRepository repository;
    private final ObjectMapper objectMapper;
    private final boolean enabled;
    private final int ttlDays;
    private final int maxCandidates;
    private final double similarityThreshold;
    private final double strictSimilarityThreshold;

    public ChatCacheService(
            AiChatCacheRepository repository,
            ObjectMapper objectMapper,
            @Value("${app.ai.chat-cache.enabled:true}") boolean enabled,
            @Value("${app.ai.chat-cache.ttl-days:30}") int ttlDays,
            @Value("${app.ai.chat-cache.max-candidates:200}") int maxCandidates,
            @Value("${app.ai.chat-cache.similarity-threshold:0.88}") double similarityThreshold,
            @Value("${app.ai.chat-cache.strict-similarity-threshold:0.94}") double strictSimilarityThreshold
    ) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.enabled = enabled;
        this.ttlDays = Math.max(1, ttlDays);
        this.maxCandidates = Math.max(20, maxCandidates);
        this.similarityThreshold = clamp(similarityThreshold, 0.80, 0.99);
        this.strictSimilarityThreshold = clamp(strictSimilarityThreshold, this.similarityThreshold, 0.995);
    }

    @Transactional
    public Optional<ChatResponse> findCachedResponse(String establishmentId, ChatRequest request) {
        if (!isCacheLookupEnabled(establishmentId, request)) return Optional.empty();

        Instant now = Instant.now();
        String normalizedQuestion = normalizeQuestion(request.message());
        Optional<AiChatCache> exact = repository
                .findFirstByEstablishmentIdAndNormalizedQuestionAndExpiresAtAfterOrderByCreatedAtDesc(
                        establishmentId,
                        normalizedQuestion,
                        now
                );
        if (exact.isPresent()) {
            return Optional.of(toResponse(touch(exact.get())));
        }

        double[] queryEmbedding = embed(normalizedQuestion);
        Set<String> queryIntents = intentTokens(normalizedQuestion);
        return repository.findByEstablishmentIdAndExpiresAtAfterOrderByCreatedAtDesc(
                        establishmentId,
                        now,
                        PageRequest.of(0, maxCandidates)
                )
                .stream()
                .filter(cache -> !normalizedQuestion.equals(cache.getNormalizedQuestion()))
                .map(cache -> new CacheCandidate(
                        cache,
                        cosine(queryEmbedding, parseEmbedding(cache.getEmbedding(), cache.getNormalizedQuestion())),
                        intentCompatible(queryIntents, intentTokens(cache.getNormalizedQuestion()))
                ))
                .filter(candidate -> candidate.score() >= (candidate.intentCompatible()
                        ? similarityThreshold
                        : strictSimilarityThreshold))
                .max(Comparator.comparingDouble(CacheCandidate::score))
                .map(candidate -> toResponse(touch(candidate.cache())));
    }

    @Transactional
    public void storeResponse(String establishmentId, ChatRequest request, ChatResponse response) {
        if (!isCacheLookupEnabled(establishmentId, request) || !isCacheableResponse(response)) return;

        Instant now = Instant.now();
        String normalizedQuestion = normalizeQuestion(request.message());
        if (repository.findFirstByEstablishmentIdAndNormalizedQuestionAndExpiresAtAfterOrderByCreatedAtDesc(
                establishmentId,
                normalizedQuestion,
                now
        ).isPresent()) {
            return;
        }

        AiChatCache cache = new AiChatCache();
        cache.setEstablishmentId(establishmentId);
        cache.setNormalizedQuestion(normalizedQuestion);
        cache.setQuestion(request.message().trim());
        cache.setAnswer(response.reply().trim());
        cache.setTopicsJson(serializeTopics(response.topics()));
        cache.setModel(response.model() == null || response.model().isBlank() ? "unknown" : response.model());
        cache.setEmbedding(serializeEmbedding(embed(normalizedQuestion)));
        cache.setSourceGenerationId(blankToNull(response.generationId()));
        cache.setExpiresAt(now.plus(ttlDays, ChronoUnit.DAYS));
        repository.save(cache);
    }

    private boolean isCacheLookupEnabled(String establishmentId, ChatRequest request) {
        return enabled
                && establishmentId != null
                && !establishmentId.isBlank()
                && isCacheableRequest(request);
    }

    private boolean isCacheableRequest(ChatRequest request) {
        if (request == null || request.message() == null) return false;
        String message = request.message().trim();
        if (message.length() < 8 || message.length() > MAX_CACHEABLE_MESSAGE_LENGTH) return false;
        if (EMAIL_PATTERN.matcher(message).find()
                || CPF_PATTERN.matcher(message).find()
                || SPECIFIC_NUMBER_PATTERN.matcher(message).find()) {
            return false;
        }
        if (request.history() != null && request.history().stream()
                .anyMatch(item -> item != null
                        && "user".equalsIgnoreCase(item.role())
                        && item.content() != null
                        && !item.content().isBlank())) {
            return false;
        }

        List<String> tokens = tokens(normalizeQuestion(message));
        if (tokens.size() < 3) return false;
        return tokens.stream().noneMatch(CONTEXTUAL_WORDS::contains);
    }

    private boolean isCacheableResponse(ChatResponse response) {
        return response != null
                && response.success()
                && response.error() == null
                && response.reply() != null
                && !response.reply().isBlank()
                && response.reply().length() <= MAX_CACHEABLE_REPLY_LENGTH
                && (response.generationId() != null || response.usage() != null);
    }

    private AiChatCache touch(AiChatCache cache) {
        cache.setHitCount(cache.getHitCount() + 1);
        cache.setLastHitAt(Instant.now());
        return repository.save(cache);
    }

    private ChatResponse toResponse(AiChatCache cache) {
        return new ChatResponse(
                true,
                cache.getAnswer(),
                "cache:" + cache.getModel(),
                parseTopics(cache.getTopicsJson()),
                null,
                "cache:" + cache.getId(),
                null,
                null
        );
    }

    private String serializeTopics(List<String> topics) {
        try {
            List<String> safeTopics = topics == null
                    ? List.of()
                    : topics.stream()
                    .filter(topic -> topic != null && !topic.isBlank())
                    .map(String::trim)
                    .limit(8)
                    .toList();
            return objectMapper.writeValueAsString(safeTopics);
        } catch (Exception exception) {
            return "[]";
        }
    }

    private List<String> parseTopics(String topicsJson) {
        try {
            if (topicsJson == null || topicsJson.isBlank()) return List.of();
            return objectMapper.readValue(topicsJson, new TypeReference<List<String>>() {});
        } catch (Exception exception) {
            return List.of();
        }
    }

    private static String normalizeQuestion(String value) {
        String withoutMarks = Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return withoutMarks
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static List<String> tokens(String normalizedQuestion) {
        if (normalizedQuestion == null || normalizedQuestion.isBlank()) return List.of();
        return Arrays.stream(normalizedQuestion.split(" "))
                .map(String::trim)
                .filter(token -> token.length() > 1)
                .filter(token -> !STOP_WORDS.contains(token))
                .toList();
    }

    private static Set<String> intentTokens(String normalizedQuestion) {
        return tokens(normalizedQuestion).stream()
                .map(ChatCacheService::canonicalToken)
                .filter(DOMAIN_INTENTS::contains)
                .collect(java.util.stream.Collectors.toUnmodifiableSet());
    }

    private static boolean intentCompatible(Set<String> left, Set<String> right) {
        if (left.isEmpty() || right.isEmpty()) return false;
        return left.stream().anyMatch(right::contains);
    }

    private static double[] embed(String normalizedQuestion) {
        double[] vector = new double[VECTOR_SIZE];
        List<String> tokenList = tokens(normalizedQuestion);
        tokenList.forEach(token -> {
            addFeature(vector, "tok:" + token, 0.8);
            addFeature(vector, "canon:" + canonicalToken(token), 1.4);
        });

        String compact = String.join(" ", tokenList);
        if (compact.length() >= 3) {
            for (int index = 0; index <= compact.length() - 3; index++) {
                addFeature(vector, "tri:" + compact.substring(index, index + 3), 0.25);
            }
        }

        normalizeVector(vector);
        return vector;
    }

    private static void addFeature(double[] vector, String feature, double weight) {
        int hash = feature.hashCode();
        int index = Math.floorMod(hash, vector.length);
        double sign = (hash & 1) == 0 ? 1.0 : -1.0;
        vector[index] += weight * sign;
    }

    private static void normalizeVector(double[] vector) {
        double norm = 0;
        for (double value : vector) norm += value * value;
        if (norm == 0) return;
        double divisor = Math.sqrt(norm);
        for (int index = 0; index < vector.length; index++) {
            vector[index] = vector[index] / divisor;
        }
    }

    private static String canonicalToken(String token) {
        String canonical = CANONICAL_TOKENS.get(token);
        if (canonical != null) return canonical;
        if (token.length() > 4 && token.endsWith("s")) {
            canonical = CANONICAL_TOKENS.get(token.substring(0, token.length() - 1));
            if (canonical != null) return canonical;
        }
        if (token.length() < 4) return token;

        return CANONICAL_TOKENS.entrySet().stream()
                .filter(entry -> Math.abs(entry.getKey().length() - token.length()) <= 1)
                .filter(entry -> isAtMostOneEditApart(token, entry.getKey()))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse(token);
    }

    private static boolean isAtMostOneEditApart(String left, String right) {
        if (left.equals(right)) return true;
        if (Math.abs(left.length() - right.length()) > 1) return false;

        String shorter = left.length() <= right.length() ? left : right;
        String longer = left.length() <= right.length() ? right : left;
        int shortIndex = 0;
        int longIndex = 0;
        int edits = 0;

        while (shortIndex < shorter.length() && longIndex < longer.length()) {
            if (shorter.charAt(shortIndex) == longer.charAt(longIndex)) {
                shortIndex++;
                longIndex++;
                continue;
            }
            if (++edits > 1) return false;
            if (shorter.length() == longer.length()) shortIndex++;
            longIndex++;
        }
        if (longIndex < longer.length()) edits++;
        return edits <= 1;
    }

    private static String serializeEmbedding(double[] embedding) {
        StringBuilder builder = new StringBuilder(embedding.length * 8);
        for (int index = 0; index < embedding.length; index++) {
            if (index > 0) builder.append(',');
            builder.append(embedding[index]);
        }
        return builder.toString();
    }

    private static double[] parseEmbedding(String embedding, String fallbackQuestion) {
        if (embedding == null || embedding.isBlank()) return embed(fallbackQuestion);
        String[] parts = embedding.split(",");
        if (parts.length != VECTOR_SIZE) return embed(fallbackQuestion);
        double[] vector = new double[VECTOR_SIZE];
        try {
            for (int index = 0; index < parts.length; index++) {
                vector[index] = Double.parseDouble(parts[index]);
            }
            return vector;
        } catch (NumberFormatException exception) {
            return embed(fallbackQuestion);
        }
    }

    private static double cosine(double[] left, double[] right) {
        double score = 0;
        for (int index = 0; index < Math.min(left.length, right.length); index++) {
            score += left[index] * right[index];
        }
        return score;
    }

    private static double clamp(double value, double minimum, double maximum) {
        return Math.max(minimum, Math.min(maximum, value));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private record CacheCandidate(AiChatCache cache, double score, boolean intentCompatible) {
    }
}
