package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.domain.repository.ProtocolRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.RestClient;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

class AiImageCorrectionServiceTest {

    @Test
    void acceptsSupportedImageDataUrlsWithoutDependingOnMediaTypeCase() {
        assertTrue(AiImageCorrectionService.isSupportedImageDataUrl("data:image/jpeg;base64,abc"));
        assertTrue(AiImageCorrectionService.isSupportedImageDataUrl("data:image/png;base64,abc"));
        assertTrue(AiImageCorrectionService.isSupportedImageDataUrl("DATA:IMAGE/WEBP;BASE64,abc"));
    }

    @Test
    void rejectsUrlsAndUnsupportedImageFormats() {
        assertFalse(AiImageCorrectionService.isSupportedImageDataUrl("https://example.com/image.jpg"));
        assertFalse(AiImageCorrectionService.isSupportedImageDataUrl("data:image/svg+xml;base64,abc"));
    }

    @Test
    void parsesSuccessfulFunctionResponseWithExtraMetadata() throws Exception {
        Object response = parseCorrectionResponse(
                HttpStatus.OK,
                """
                {
                  "success": true,
                  "image_urls": ["data:image/jpeg;base64,abc"],
                  "correction_report": "- Calçada nivelada",
                  "model": "google/gemini-3.1-flash-image"
                }
                """
        );

        Method success = response.getClass().getDeclaredMethod("success");
        success.setAccessible(true);
        assertEquals(true, success.invoke(response));
    }

    @Test
    void exposesFunctionErrorMessageFromNonSuccessfulStatus() throws Exception {
        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> parseCorrectionResponse(
                        HttpStatus.BAD_GATEWAY,
                        "{\"success\":false,\"error\":\"A imagem corrigida ficou maior que o limite permitido. Tente gerar novamente.\"}"
                )
        );

        assertEquals(
                "A imagem corrigida ficou maior que o limite permitido. Tente gerar novamente.",
                exception.getMessage()
        );
    }

    private static Object parseCorrectionResponse(HttpStatus status, String body) throws Exception {
        AiImageCorrectionService service = new AiImageCorrectionService(
                mock(ProtocolRepository.class),
                RestClient.create(),
                new ObjectMapper(),
                "https://example.supabase.co/functions/v1/classify-priority",
                "",
                "anon",
                "secret"
        );
        Method method = AiImageCorrectionService.class.getDeclaredMethod(
                "parseCorrectionResponse",
                org.springframework.http.HttpStatusCode.class,
                String.class
        );
        method.setAccessible(true);

        try {
            return method.invoke(service, status, body);
        } catch (InvocationTargetException exception) {
            Throwable cause = exception.getCause();
            throw assertInstanceOf(Exception.class, cause);
        }
    }
}
