package br.com.fiap.hackgov.application.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

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
}
