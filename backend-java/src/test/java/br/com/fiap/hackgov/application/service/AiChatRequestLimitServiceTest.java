package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.domain.ai.AiChatRequestEvent;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaAiChatRequestEventRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiChatRequestLimitServiceTest {

    @Test
    void recordsTenthQuestionInsideRollingHour() {
        JpaAiChatRequestEventRepository repository = mock(JpaAiChatRequestEventRepository.class);
        when(repository.countByUserIdAndCreatedAtGreaterThanEqual(eq("user-1"), any())).thenReturn(9L);
        AiChatRequestLimitService service = new AiChatRequestLimitService(repository, 10);

        service.checkAndRecord("est-1", "user-1");

        verify(repository).lockByUserId("user-1");
        ArgumentCaptor<AiChatRequestEvent> event = ArgumentCaptor.forClass(AiChatRequestEvent.class);
        verify(repository).save(event.capture());
        assertEquals("est-1", event.getValue().getEstablishmentId());
        assertEquals("user-1", event.getValue().getUserId());
    }

    @Test
    void blocksEleventhQuestionInsideRollingHour() {
        JpaAiChatRequestEventRepository repository = mock(JpaAiChatRequestEventRepository.class);
        when(repository.countByUserIdAndCreatedAtGreaterThanEqual(eq("user-1"), any())).thenReturn(10L);
        AiChatRequestLimitService service = new AiChatRequestLimitService(repository, 10);

        AiUsageLimitExceededException exception = assertThrows(
                AiUsageLimitExceededException.class,
                () -> service.checkAndRecord("est-1", "user-1")
        );

        assertEquals(
                "Você atingiu o limite de 10 perguntas em 60 minutos. Aguarde antes de enviar uma nova pergunta.",
                exception.getMessage()
        );
        verify(repository, never()).save(any());
    }
}
