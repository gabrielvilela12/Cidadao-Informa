package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.domain.ai.AiChatCache;
import br.com.fiap.hackgov.infrastructure.repository.AiChatCacheRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class ChatCacheServiceTest {

    @Test
    void reusesSemanticallyEquivalentQuestionWithTypingError() {
        AiChatCacheRepository repository = mock(AiChatCacheRepository.class);
        ChatCacheService service = service(repository);
        AiChatCache cached = cachedAnswer("como abrir um chamado para buraco no asfalto");
        when(repository.findFirstByEstablishmentIdAndNormalizedQuestionAndExpiresAtAfterOrderByCreatedAtDesc(
                eq("est-1"), anyString(), any(Instant.class)
        )).thenReturn(Optional.empty());
        when(repository.findByEstablishmentIdAndExpiresAtAfterOrderByCreatedAtDesc(
                eq("est-1"), any(Instant.class), any(Pageable.class)
        )).thenReturn(List.of(cached));
        when(repository.save(cached)).thenReturn(cached);

        Optional<ChatAssistantService.ChatResponse> result = service.findCachedResponse(
                "est-1",
                new ChatAssistantService.ChatRequest(
                        "Como abri um chamado para buraco no asfalto?",
                        null,
                        null
                )
        );

        assertTrue(result.isPresent());
        assertEquals("Use a tela Nova solicitacao.", result.orElseThrow().reply());
        assertTrue(result.orElseThrow().model().startsWith("cache:"));
    }

    @Test
    void doesNotLookupQuestionsContainingPersonalData() {
        AiChatCacheRepository repository = mock(AiChatCacheRepository.class);
        ChatCacheService service = service(repository);

        Optional<ChatAssistantService.ChatResponse> result = service.findCachedResponse(
                "est-1",
                new ChatAssistantService.ChatRequest(
                        "Consulte o protocolo para o CPF 123.456.789-00",
                        null,
                        null
                )
        );

        assertTrue(result.isEmpty());
        verifyNoInteractions(repository);
    }

    private ChatCacheService service(AiChatCacheRepository repository) {
        return new ChatCacheService(repository, new ObjectMapper(), true, 30, 200, 0.88, 0.94);
    }

    private AiChatCache cachedAnswer(String normalizedQuestion) {
        AiChatCache cache = new AiChatCache();
        cache.setId("cache-1");
        cache.setEstablishmentId("est-1");
        cache.setNormalizedQuestion(normalizedQuestion);
        cache.setQuestion(normalizedQuestion);
        cache.setAnswer("Use a tela Nova solicitacao.");
        cache.setTopicsJson("[\"Nova solicitacao\"]");
        cache.setModel("modelo-teste");
        cache.setEmbedding("");
        cache.setExpiresAt(Instant.now().plusSeconds(3600));
        return cache;
    }
}
