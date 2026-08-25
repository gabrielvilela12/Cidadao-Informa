package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.application.service.AiPromptService;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminAiPromptsControllerTest {
    @Test
    void allowsAdminToListPrompts() {
        AiPromptService service = mock(AiPromptService.class);
        when(service.list()).thenReturn(List.of());
        AdminAiPromptsController controller = new AdminAiPromptsController(service);

        assertEquals(HttpStatus.OK, controller.list(authentication("admin")).getStatusCode());
        verify(service).list();
    }

    @Test
    void blocksCitizensFromPromptManagement() {
        AdminAiPromptsController controller = new AdminAiPromptsController(mock(AiPromptService.class));
        assertEquals(HttpStatus.FORBIDDEN, controller.list(authentication("citizen")).getStatusCode());
    }

    private Authentication authentication(String role) {
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(
                new AuthenticatedUser("user-id", "Usuário", "12345678901", role)
        );
        return authentication;
    }
}
