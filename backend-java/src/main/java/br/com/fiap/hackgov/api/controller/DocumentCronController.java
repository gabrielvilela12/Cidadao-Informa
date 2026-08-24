package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.application.service.ProtocolDocumentService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;

@RestController
@RequestMapping("/api/cron/documents")
public class DocumentCronController {

    private final ProtocolDocumentService documentService;
    private final String cronSecret;

    public DocumentCronController(
            ProtocolDocumentService documentService,
            @Value("${app.cron.secret:}") String cronSecret
    ) {
        this.documentService = documentService;
        this.cronSecret = cronSecret;
    }

    @GetMapping
    public ResponseEntity<?> generate(@RequestHeader(value = "Authorization", required = false) String authorization) {
        if (cronSecret == null || cronSecret.isBlank()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "Rotina de documentos não configurada."));
        }
        String expected = "Bearer " + cronSecret;
        if (authorization == null || !MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                authorization.getBytes(StandardCharsets.UTF_8))) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Credencial da rotina inválida."));
        }
        return ResponseEntity.ok(documentService.generateAllCompleted());
    }
}

