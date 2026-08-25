package br.com.fiap.hackgov.infrastructure.config;

import br.com.fiap.hackgov.infrastructure.security.JwtAuthenticationEntryPoint;
import br.com.fiap.hackgov.infrastructure.security.JwtAuthenticationFilter;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

class SecurityConfigTest {
    @Test
    void allowsPutForAdministrativeUpdates() {
        SecurityConfig security = new SecurityConfig(
                mock(JwtAuthenticationFilter.class),
                mock(JwtAuthenticationEntryPoint.class),
                List.of("https://cidadao-informa.vercel.app")
        );
        MockHttpServletRequest request = new MockHttpServletRequest("PUT", "/api/admin/server-permissions/user-1");
        request.addHeader("Origin", "https://cidadao-informa.vercel.app");

        CorsConfiguration cors = security.corsConfigurationSource().getCorsConfiguration(request);

        assertNotNull(cors);
        assertTrue(cors.getAllowedMethods().contains("PUT"));
    }
}
