package br.com.fiap.hackgov.infrastructure.security;

import br.com.fiap.hackgov.application.dto.auth.LoginInputDto;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LoginRateLimiterTest {

    @Test
    void shouldBlockAfterCpfFailureLimit() {
        LoginRateLimiter limiter = new LoginRateLimiter(10, 2, 15);
        HttpServletRequest request = requestFrom("203.0.113.10");
        LoginInputDto input = new LoginInputDto("12345678901", "senha-errada");

        assertTrue(limiter.check(request, input).allowed());
        limiter.recordFailure(request, input);
        assertTrue(limiter.check(request, input).allowed());
        limiter.recordFailure(request, input);

        LoginRateLimiter.RateLimitDecision decision = limiter.check(request, input);

        assertFalse(decision.allowed());
        assertTrue(decision.retryAfterSeconds() > 0);
    }

    @Test
    void shouldResetFailuresAfterSuccessfulLogin() {
        LoginRateLimiter limiter = new LoginRateLimiter(10, 2, 15);
        HttpServletRequest request = requestFrom("203.0.113.10");
        LoginInputDto input = new LoginInputDto("12345678901", "senha-errada");

        limiter.recordFailure(request, input);
        limiter.recordFailure(request, input);
        assertFalse(limiter.check(request, input).allowed());

        limiter.recordSuccess(request, input);

        assertTrue(limiter.check(request, input).allowed());
    }

    @Test
    void shouldBlockAfterIpFailureLimitEvenWithDifferentCpfs() {
        LoginRateLimiter limiter = new LoginRateLimiter(2, 10, 15);
        HttpServletRequest request = requestFrom("203.0.113.10");

        limiter.recordFailure(request, new LoginInputDto("12345678901", "senha-errada"));
        limiter.recordFailure(request, new LoginInputDto("12345678902", "senha-errada"));

        assertFalse(limiter.check(request, new LoginInputDto("12345678903", "senha-errada")).allowed());
    }

    private HttpServletRequest requestFrom(String ip) {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-Forwarded-For")).thenReturn(ip + ", 10.0.0.1");
        when(request.getRemoteAddr()).thenReturn("10.0.0.1");
        return request;
    }
}