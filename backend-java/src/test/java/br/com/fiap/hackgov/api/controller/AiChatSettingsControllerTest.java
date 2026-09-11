package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.application.dto.ai.AiChatSettingsOutputDto;
import br.com.fiap.hackgov.application.service.AdminAccessService;
import br.com.fiap.hackgov.application.service.AiChatSettingsService;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class AiChatSettingsControllerTest {

    @Test
    void allowsAuthorizedServerToDisableChat() {
        AiChatSettingsService settingsService = mock(AiChatSettingsService.class);
        AdminAccessService accessService = mock(AdminAccessService.class);
        AiChatSettingsController controller = new AiChatSettingsController(settingsService, accessService);
        AiChatSettingsOutputDto settings = new AiChatSettingsOutputDto("est-1", "Prefeitura", false);
        when(settingsService.update("est-1", false)).thenReturn(settings);

        ResponseEntity<?> response = controller.update(
                new AiChatSettingsController.UpdateAiChatSettingsRequest(false),
                authentication("admin")
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertSame(settings, response.getBody());
        verify(accessService).requireScreen("user-1", AdminAccessService.AI);
        verify(settingsService).update("est-1", false);
    }

    @Test
    void blocksCitizenFromChangingChatAvailability() {
        AiChatSettingsService settingsService = mock(AiChatSettingsService.class);
        AdminAccessService accessService = mock(AdminAccessService.class);
        AiChatSettingsController controller = new AiChatSettingsController(settingsService, accessService);

        ResponseEntity<?> response = controller.update(
                new AiChatSettingsController.UpdateAiChatSettingsRequest(false),
                authentication("citizen")
        );

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        verifyNoInteractions(settingsService, accessService);
    }

    private Authentication authentication(String role) {
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(
                new AuthenticatedUser("user-1", "Usuario", "123", role, "est-1")
        );
        return authentication;
    }
}
