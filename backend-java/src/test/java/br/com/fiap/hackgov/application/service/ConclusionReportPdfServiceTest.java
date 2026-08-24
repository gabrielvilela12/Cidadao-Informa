package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.domain.document.ConclusionDocumentSnapshot;
import br.com.fiap.hackgov.domain.document.ProtocolDocumentType;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ConclusionReportPdfServiceTest {

    private static final String HASH = "8b91e80f10b70f650e17704db025b0867adfc8177b0a9bb64943561db3b157a1";

    @Test
    void rendersPublicAndInternalExamples() throws Exception {
        ConclusionReportPdfService service = new ConclusionReportPdfService();
        String before = dataUrl(Path.of("..", "public", "results-before.png"));
        String after = dataUrl(Path.of("..", "public", "results-after.png"));

        byte[] publicPdf = service.render(snapshot(true), List.of(before), List.of(after));
        byte[] internalPdf = service.render(snapshot(false), List.of(before), List.of(after));

        assertPdf(publicPdf);
        assertPdf(internalPdf);

        String examplesDir = System.getProperty("pdf.examples.dir");
        if (examplesDir != null && !examplesDir.isBlank()) {
            Path output = Path.of(examplesDir).toAbsolutePath().normalize();
            Files.createDirectories(output);
            Files.write(output.resolve("relatorio-conclusao-publico-exemplo.pdf"), publicPdf);
            Files.write(output.resolve("relatorio-conclusao-interno-exemplo.pdf"), internalPdf);
        }
    }

    private ConclusionDocumentSnapshot snapshot(boolean isPublic) {
        return new ConclusionDocumentSnapshot(
                UUID.fromString(isPublic
                        ? "fdad2a2d-4dfc-48cf-ae69-989a6692792b"
                        : "7758f207-a46a-4ec9-b037-135366533199"),
                1,
                isPublic ? ProtocolDocumentType.CONCLUSION_PUBLIC : ProtocolDocumentType.CONCLUSION_INTERNAL,
                "b13abc66-0622-4463-be15-35cfad925a5b",
                "Física",
                "Calçada sem rebaixamento e com pavimento irregular, impedindo a circulação segura de pessoas com mobilidade reduzida.",
                "Avenida Costábile Romano, 1930 - Ribeirânia, Ribeirão Preto - SP",
                "Concluído",
                new BigDecimal("12850.40"),
                "Alta",
                "A equipe executou o rebaixamento da guia, recompôs o piso tátil e nivelou a faixa de circulação. A simulação de IA apresenta uma referência visual da solução planejada e não substitui a vistoria técnica.",
                Instant.parse("2026-08-09T13:42:00Z"),
                Instant.parse("2026-08-23T19:18:00Z"),
                Instant.parse("2026-08-24T03:00:00Z"),
                isPublic ? null : "Mariana de Souza Oliveira",
                isPublic ? null : "mariana.oliveira@example.com",
                isPublic ? null : "12345678901",
                isPublic ? null : "(16) 99999-1234",
                "42aa66b23a12ffd106602088bab9b12cb32d05ed71dc436082b8616c4b6db585",
                "https://cidadao-informa.vercel.app/p/b13abc66-0622-4463-be15-35cfad925a5b",
                HASH
        );
    }

    private String dataUrl(Path path) throws Exception {
        return "data:image/png;base64," + Base64.getEncoder().encodeToString(Files.readAllBytes(path));
    }

    private void assertPdf(byte[] content) throws Exception {
        assertTrue(content.length > 10_000);
        try (PDDocument document = Loader.loadPDF(content)) {
            assertEquals(2, document.getNumberOfPages());
        }
    }
}

