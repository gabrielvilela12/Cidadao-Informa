package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.application.service.ProtocolDocumentService;
import br.com.fiap.hackgov.domain.document.ProtocolDocumentType;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;

@RestController
public class ProtocolDocumentsController {

    private final ProtocolDocumentService documentService;

    public ProtocolDocumentsController(ProtocolDocumentService documentService) {
        this.documentService = documentService;
    }

    @GetMapping(value = "/api/protocols/public/{id}/documents/conclusion.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> publicConclusion(@PathVariable String id) {
        return pdfResponse(
                documentService.renderLatest(id, ProtocolDocumentType.CONCLUSION_PUBLIC),
                "relatorio-conclusao-publico-" + shortId(id) + ".pdf"
        );
    }

    @GetMapping(value = "/api/protocols/{id}/documents/conclusion/internal.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> internalConclusion(@PathVariable String id, Authentication authentication) {
        requireAdmin(authentication);
        return pdfResponse(
                documentService.renderLatest(id, ProtocolDocumentType.CONCLUSION_INTERNAL),
                "relatorio-conclusao-interno-" + shortId(id) + ".pdf"
        );
    }

    private ResponseEntity<byte[]> pdfResponse(byte[] content, String filename) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename(filename, StandardCharsets.UTF_8)
                .build());
        headers.setCacheControl(CacheControl.noStore());
        return ResponseEntity.ok().headers(headers).body(content);
    }

    private void requireAdmin(Authentication authentication) {
        if (authentication == null
                || !(authentication.getPrincipal() instanceof AuthenticatedUser user)
                || !"admin".equalsIgnoreCase(user.role())) {
            throw new IllegalArgumentException("Acesso restrito a administradores.");
        }
    }

    private String shortId(String id) {
        return id.substring(0, Math.min(id.length(), 8));
    }
}

