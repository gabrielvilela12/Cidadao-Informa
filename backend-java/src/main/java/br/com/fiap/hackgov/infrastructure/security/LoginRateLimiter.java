package br.com.fiap.hackgov.infrastructure.security;

import br.com.fiap.hackgov.application.dto.auth.LoginInputDto;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Component
public class LoginRateLimiter {

    private static final String UNKNOWN_CLIENT = "unknown";
    private static final long CLEANUP_INTERVAL_MILLIS = 60_000;
    private static final int CLEANUP_SIZE_THRESHOLD = 2_048;

    private final ConcurrentMap<String, AttemptWindow> attempts = new ConcurrentHashMap<>();
    private final int maxFailuresPerIp;
    private final int maxFailuresPerCpf;
    private final Duration window;
    private volatile long lastCleanupMillis;

    public LoginRateLimiter(
            @Value("${app.security.login-rate-limit.max-failures-per-ip:30}") int maxFailuresPerIp,
            @Value("${app.security.login-rate-limit.max-failures-per-cpf:10}") int maxFailuresPerCpf,
            @Value("${app.security.login-rate-limit.window-minutes:15}") long windowMinutes
    ) {
        this.maxFailuresPerIp = Math.max(1, maxFailuresPerIp);
        this.maxFailuresPerCpf = Math.max(1, maxFailuresPerCpf);
        this.window = Duration.ofMinutes(Math.max(1, windowMinutes));
    }

    public RateLimitDecision check(HttpServletRequest request, LoginInputDto input) {
        cleanupExpiredIfNeeded();

        Instant now = Instant.now();
        long retryAfterSeconds = 0;

        for (LimitKey key : keys(request, input)) {
            AttemptWindow attemptWindow = attempts.get(key.value());
            if (attemptWindow != null
                    && attemptWindow.resetAt().isAfter(now)
                    && attemptWindow.failures() >= key.maxFailures()) {
                retryAfterSeconds = Math.max(
                        retryAfterSeconds,
                        Duration.between(now, attemptWindow.resetAt()).toSeconds()
                );
            }
        }

        return retryAfterSeconds > 0
                ? RateLimitDecision.blocked(Math.max(1, retryAfterSeconds))
                : RateLimitDecision.permitted();
    }

    public void recordFailure(HttpServletRequest request, LoginInputDto input) {
        Instant now = Instant.now();
        Instant resetAt = now.plus(window);

        for (LimitKey key : keys(request, input)) {
            attempts.compute(key.value(), (ignored, current) -> {
                if (current == null || !current.resetAt().isAfter(now)) {
                    return new AttemptWindow(1, resetAt);
                }

                return new AttemptWindow(current.failures() + 1, current.resetAt());
            });
        }

        cleanupExpiredIfNeeded();
    }

    public void recordSuccess(HttpServletRequest request, LoginInputDto input) {
        for (LimitKey key : keys(request, input)) {
            attempts.remove(key.value());
        }
    }

    private List<LimitKey> keys(HttpServletRequest request, LoginInputDto input) {
        List<LimitKey> keys = new ArrayList<>(2);
        keys.add(new LimitKey("ip:" + clientIp(request), maxFailuresPerIp));

        String cpf = input == null || input.cpf() == null
                ? ""
                : input.cpf().replaceAll("\\D", "");
        if (!cpf.isBlank()) {
            keys.add(new LimitKey("cpf:" + sha256(cpf), maxFailuresPerCpf));
        }

        return keys;
    }

    private String clientIp(HttpServletRequest request) {
        if (request == null) {
            return UNKNOWN_CLIENT;
        }

        String forwardedFor = firstHeaderValue(request.getHeader("X-Forwarded-For"));
        if (!forwardedFor.isBlank()) {
            return forwardedFor;
        }

        String realIp = headerValue(request.getHeader("X-Real-IP"));
        if (!realIp.isBlank()) {
            return realIp;
        }

        String forwarded = forwardedHeaderFor(request.getHeader("Forwarded"));
        if (!forwarded.isBlank()) {
            return forwarded;
        }

        String remoteAddr = headerValue(request.getRemoteAddr());
        return remoteAddr.isBlank() ? UNKNOWN_CLIENT : remoteAddr;
    }

    private String firstHeaderValue(String header) {
        String value = headerValue(header);
        int comma = value.indexOf(',');
        return comma >= 0 ? value.substring(0, comma).trim() : value;
    }

    private String forwardedHeaderFor(String header) {
        String value = headerValue(header);
        if (value.isBlank()) {
            return "";
        }

        for (String part : value.split(";")) {
            String trimmed = part.trim();
            if (trimmed.regionMatches(true, 0, "for=", 0, 4)) {
                return trimmed.substring(4).replace("\"", "").trim();
            }
        }

        return "";
    }

    private String headerValue(String header) {
        if (header == null) {
            return "";
        }

        String value = header.trim();
        return "unknown".equalsIgnoreCase(value) ? "" : value;
    }

    private void cleanupExpiredIfNeeded() {
        long nowMillis = System.currentTimeMillis();
        if (attempts.size() < CLEANUP_SIZE_THRESHOLD
                && nowMillis - lastCleanupMillis < CLEANUP_INTERVAL_MILLIS) {
            return;
        }

        lastCleanupMillis = nowMillis;
        Instant now = Instant.now();
        for (Map.Entry<String, AttemptWindow> entry : attempts.entrySet()) {
            if (!entry.getValue().resetAt().isAfter(now)) {
                attempts.remove(entry.getKey(), entry.getValue());
            }
        }
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 indisponivel.", exception);
        }
    }

    private record AttemptWindow(int failures, Instant resetAt) {
    }

    private record LimitKey(String value, int maxFailures) {
    }

    public record RateLimitDecision(boolean allowed, long retryAfterSeconds) {

        private static RateLimitDecision permitted() {
            return new RateLimitDecision(true, 0);
        }

        private static RateLimitDecision blocked(long retryAfterSeconds) {
            return new RateLimitDecision(false, retryAfterSeconds);
        }
    }
}