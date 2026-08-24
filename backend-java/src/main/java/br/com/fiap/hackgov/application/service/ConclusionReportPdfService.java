package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.domain.document.ConclusionDocumentSnapshot;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.common.BitMatrix;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.JPEGFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class ConclusionReportPdfService {

    private static final Color NAVY = new Color(5, 34, 78);
    private static final Color BLUE = new Color(7, 88, 189);
    private static final Color SKY = new Color(231, 240, 255);
    private static final Color GREEN = new Color(0, 143, 68);
    private static final Color GREEN_LIGHT = new Color(229, 247, 237);
    private static final Color GOLD = new Color(241, 184, 0);
    private static final Color INK = new Color(23, 41, 69);
    private static final Color MUTED = new Color(89, 105, 128);
    private static final Color LINE = new Color(218, 226, 237);
    private static final Color PAPER = new Color(247, 250, 253);
    private static final Color WHITE = Color.WHITE;

    private static final float PAGE_WIDTH = PDRectangle.A4.getWidth();
    private static final float PAGE_HEIGHT = PDRectangle.A4.getHeight();
    private static final float MARGIN = 42;
    private static final float CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);
    private static final ZoneId BRASILIA = ZoneId.of("America/Sao_Paulo");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.forLanguageTag("pt-BR"));
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("dd/MM/yyyy, HH:mm", Locale.forLanguageTag("pt-BR"));
    private static final NumberFormat BRL = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("pt-BR"));

    private final PDType1Font regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
    private final PDType1Font bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);

    public byte[] render(
            ConclusionDocumentSnapshot snapshot,
            List<String> originalImages,
            List<String> correctedImages
    ) {
        try (PDDocument document = new PDDocument()) {
            PDPage overview = new PDPage(PDRectangle.A4);
            PDPage evidence = new PDPage(PDRectangle.A4);
            document.addPage(overview);
            document.addPage(evidence);

            drawOverview(document, overview, snapshot);
            drawEvidence(document, evidence, snapshot, originalImages, correctedImages);
            drawFooter(document, overview, snapshot, 1, 2);
            drawFooter(document, evidence, snapshot, 2, 2);

            ByteArrayOutputStream output = new ByteArrayOutputStream();
            document.save(output);
            return output.toByteArray();
        } catch (Exception exception) {
            throw new IllegalStateException("Não foi possível gerar o relatório em PDF.", exception);
        }
    }

    private void drawOverview(PDDocument document, PDPage page, ConclusionDocumentSnapshot s) throws Exception {
        try (PDPageContentStream cs = new PDPageContentStream(document, page)) {
            background(cs);
            header(cs, s, "RELATÓRIO DE CONCLUSÃO");

            float y = 702;
            text(cs, "PROTOCOLO", MARGIN, y, 8, bold, BLUE);
            text(cs, "#" + shortId(s.protocolId()), MARGIN, y - 30, 25, bold, NAVY);
            badge(cs, s.isPublic() ? "VERSÃO PÚBLICA" : "USO INTERNO", 400, y - 23,
                    s.isPublic() ? GREEN : BLUE);

            y -= 73;
            card(cs, MARGIN, y - 75, 155, 75, "STATUS", label(s.status()), GREEN, GREEN_LIGHT);
            card(cs, MARGIN + 168, y - 75, 155, 75, "CUSTO DECLARADO", currency(s.resolutionCost()), BLUE, SKY);
            card(cs, MARGIN + 336, y - 75, 175, 75, "PRIORIDADE", value(s.aiPriority()), GOLD, new Color(255, 248, 225));

            y -= 110;
            sectionTitle(cs, "Dados da solicitação", y);
            y -= 24;
            keyValue(cs, "Categoria", value(s.category()), MARGIN, y, 230);
            keyValue(cs, "Abertura", date(s.createdAt()), MARGIN + 260, y, 240);
            y -= 44;
            keyValue(cs, "Conclusão", dateTime(s.concludedAt()), MARGIN, y, 230);
            keyValue(cs, "Versão do documento", "v" + s.version(), MARGIN + 260, y, 240);

            y -= 55;
            sectionTitle(cs, "Local da ocorrência", y);
            y -= 23;
            y = wrappedText(cs, value(s.address()), MARGIN, y, CONTENT_WIDTH, 10.5f, regular, INK, 15, 2);

            y -= 20;
            sectionTitle(cs, "Resumo do chamado", y);
            y -= 23;
            y = wrappedText(cs, value(s.description()), MARGIN, y, CONTENT_WIDTH, 10.5f, regular, INK, 15, 5);

            if (s.isPublic()) {
                y -= 18;
                infoBox(cs, MARGIN, y - 55, CONTENT_WIDTH, 55, GREEN_LIGHT, GREEN,
                        "Privacidade preservada",
                        "Este documento público não apresenta nome, CPF, telefone ou e-mail do cidadão solicitante.");
            } else {
                y -= 18;
                sectionTitle(cs, "Identificação do solicitante - acesso restrito", y);
                y -= 24;
                keyValue(cs, "Nome", value(s.citizenName()), MARGIN, y, 230);
                keyValue(cs, "CPF", maskCpf(s.citizenCpf()), MARGIN + 260, y, 240);
                y -= 42;
                keyValue(cs, "E-mail", value(s.citizenEmail()), MARGIN, y, 230);
                keyValue(cs, "Telefone", value(s.citizenPhone()), MARGIN + 260, y, 240);
            }
        }
    }

    private void drawEvidence(
            PDDocument document,
            PDPage page,
            ConclusionDocumentSnapshot s,
            List<String> originalImages,
            List<String> correctedImages
    ) throws Exception {
        try (PDPageContentStream cs = new PDPageContentStream(document, page)) {
            background(cs);
            header(cs, s, "EVIDÊNCIAS E INTEGRIDADE");

            float y = 704;
            sectionTitle(cs, "Registro visual", y);
            text(cs, "Comparativo da evidência recebida e da simulação de correção, quando disponível.",
                    MARGIN, y - 18, 9, regular, MUTED);

            float imageY = 478;
            drawImageCard(document, cs, first(originalImages), MARGIN, imageY, 245, 180,
                    "ANTES", "Foto enviada pelo cidadão");
            drawImageCard(document, cs, first(correctedImages), MARGIN + 266, imageY, 245, 180,
                    "SIMULAÇÃO", "Imagem ilustrativa gerada por IA");

            y = 446;
            sectionTitle(cs, "Registro da correção", y);
            y -= 24;
            String correction = value(s.correctionReport());
            if ("Não informado".equals(correction)) {
                correction = "A equipe responsável concluiu o atendimento e registrou o custo da correção no protocolo.";
            }
            y = wrappedText(cs, correction, MARGIN, y, CONTENT_WIDTH, 10.5f, regular, INK, 15, 6);

            y -= 23;
            sectionTitle(cs, "Autenticidade do documento", y);
            y -= 26;
            float qrSize = 92;
            drawQr(cs, s.verificationUrl(), MARGIN, y - qrSize + 8, qrSize);
            text(cs, "VALIDAÇÃO PÚBLICA", MARGIN + 112, y, 8, bold, BLUE);
            wrappedText(cs, value(s.verificationUrl()), MARGIN + 112, y - 18, 355, 9, regular, INK, 13, 2);
            text(cs, "HASH DO SNAPSHOT", MARGIN + 112, y - 57, 8, bold, BLUE);
            wrappedText(cs, groupedHash(s.snapshotHash()), MARGIN + 112, y - 75, 355, 8, regular, MUTED, 12, 2);
            text(cs, "ÚLTIMO BLOCO DE AUDITORIA", MARGIN + 112, y - 113, 8, bold, BLUE);
            wrappedText(cs, groupedHash(s.auditHash()), MARGIN + 112, y - 131, 355, 8, regular, MUTED, 12, 2);

            infoBox(cs, MARGIN, 72, CONTENT_WIDTH, 48, SKY, BLUE,
                    "Documento verificável",
                    "O hash identifica exatamente o snapshot usado nesta versão. Qualquer alteração produz um código diferente.");
        }
    }

    private void header(PDPageContentStream cs, ConclusionDocumentSnapshot s, String eyebrow) throws Exception {
        fill(cs, 0, PAGE_HEIGHT - 104, PAGE_WIDTH, 104, NAVY);
        fill(cs, 0, PAGE_HEIGHT - 104, 12, 104, GREEN);
        fill(cs, 12, PAGE_HEIGHT - 104, 7, 104, GOLD);
        text(cs, "CIDADÃO", MARGIN, PAGE_HEIGHT - 45, 18, bold, WHITE);
        text(cs, "INFORMA", MARGIN + 92, PAGE_HEIGHT - 45, 18, bold, GOLD);
        text(cs, eyebrow, MARGIN, PAGE_HEIGHT - 70, 8, bold, new Color(176, 205, 242));
        textRight(cs, "DOCUMENTO " + shortId(s.documentId().toString()), PAGE_WIDTH - MARGIN,
                PAGE_HEIGHT - 45, 8, bold, new Color(176, 205, 242));
        textRight(cs, "Gerado em " + dateTime(s.generatedAt()), PAGE_WIDTH - MARGIN,
                PAGE_HEIGHT - 67, 8, regular, WHITE);
    }

    private void background(PDPageContentStream cs) throws Exception {
        fill(cs, 0, 0, PAGE_WIDTH, PAGE_HEIGHT, WHITE);
    }

    private void sectionTitle(PDPageContentStream cs, String value, float y) throws Exception {
        fill(cs, MARGIN, y - 3, 4, 17, BLUE);
        text(cs, value, MARGIN + 13, y, 13, bold, NAVY);
        stroke(cs, MARGIN + 13, y - 8, PAGE_WIDTH - MARGIN, y - 8, LINE, 0.7f);
    }

    private void card(PDPageContentStream cs, float x, float y, float w, float h,
                      String title, String value, Color accent, Color bg) throws Exception {
        fill(cs, x, y, w, h, bg);
        fill(cs, x, y, 5, h, accent);
        text(cs, title, x + 16, y + h - 23, 7.5f, bold, accent);
        fitText(cs, value, x + 16, y + 23, w - 30, 14, bold, NAVY);
    }

    private void badge(PDPageContentStream cs, String value, float x, float y, Color color) throws Exception {
        fill(cs, x, y - 8, 111, 28, color);
        text(cs, value, x + 10, y + 1, 8, bold, WHITE);
    }

    private void keyValue(PDPageContentStream cs, String key, String value, float x, float y, float width) throws Exception {
        text(cs, key.toUpperCase(Locale.ROOT), x, y, 7.5f, bold, MUTED);
        fitText(cs, value, x, y - 20, width, 10.5f, bold, INK);
    }

    private void infoBox(PDPageContentStream cs, float x, float y, float w, float h, Color bg,
                         Color accent, String title, String body) throws Exception {
        fill(cs, x, y, w, h, bg);
        fill(cs, x, y, 5, h, accent);
        text(cs, title, x + 17, y + h - 20, 9, bold, accent);
        fitText(cs, body, x + 17, y + 14, w - 30, 8.5f, regular, INK);
    }

    private void drawImageCard(PDDocument document, PDPageContentStream cs, String dataUrl,
                               float x, float y, float w, float h, String badge, String caption) throws Exception {
        fill(cs, x, y, w, h, PAPER);
        BufferedImage image = decodeDataImage(dataUrl);
        if (image == null) {
            strokeRect(cs, x, y, w, h, LINE, 1);
            text(cs, "SEM IMAGEM DISPONÍVEL", x + 52, y + 90, 8, bold, MUTED);
        } else {
            PDImageXObject pdImage = JPEGFactory.createFromImage(document, prepareForPdf(image), 0.84f, 144);
            float scale = Math.min(w / image.getWidth(), h / image.getHeight());
            float iw = image.getWidth() * scale;
            float ih = image.getHeight() * scale;
            cs.drawImage(pdImage, x + ((w - iw) / 2), y + ((h - ih) / 2), iw, ih);
        }
        fill(cs, x, y + h - 25, 77, 25, BLUE);
        text(cs, badge, x + 10, y + h - 17, 8, bold, WHITE);
        fill(cs, x, y - 27, w, 27, WHITE);
        text(cs, caption, x, y - 18, 8, regular, MUTED);
    }

    private void drawQr(PDPageContentStream cs, String content, float x, float y, float size) throws Exception {
        Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
        hints.put(EncodeHintType.MARGIN, 0);
        BitMatrix matrix = new MultiFormatWriter().encode(value(content), BarcodeFormat.QR_CODE, 33, 33, hints);
        float cell = size / matrix.getWidth();
        fill(cs, x - 4, y - 4, size + 8, size + 8, WHITE);
        cs.setNonStrokingColor(NAVY);
        for (int row = 0; row < matrix.getHeight(); row++) {
            for (int col = 0; col < matrix.getWidth(); col++) {
                if (matrix.get(col, row)) {
                    cs.addRect(x + (col * cell), y + ((matrix.getHeight() - row - 1) * cell), cell, cell);
                }
            }
        }
        cs.fill();
    }

    private BufferedImage decodeDataImage(String value) {
        if (value == null || !value.startsWith("data:image/") || !value.contains(";base64,")) return null;
        try {
            String encoded = value.substring(value.indexOf(',') + 1);
            if (encoded.length() > 8_000_000) return null;
            return ImageIO.read(new ByteArrayInputStream(Base64.getDecoder().decode(encoded)));
        } catch (Exception ignored) {
            return null;
        }
    }

    private BufferedImage prepareForPdf(BufferedImage source) {
        int maxDimension = 1400;
        float scale = Math.min(1f, maxDimension / (float) Math.max(source.getWidth(), source.getHeight()));
        int width = Math.max(1, Math.round(source.getWidth() * scale));
        int height = Math.max(1, Math.round(source.getHeight() * scale));
        BufferedImage target = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = target.createGraphics();
        try {
            graphics.setColor(Color.WHITE);
            graphics.fillRect(0, 0, width, height);
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            graphics.drawImage(source, 0, 0, width, height, null);
        } finally {
            graphics.dispose();
        }
        return target;
    }

    private void drawFooter(PDDocument document, PDPage page, ConclusionDocumentSnapshot s,
                            int pageNumber, int pageCount) throws Exception {
        try (PDPageContentStream cs = new PDPageContentStream(
                document, page, PDPageContentStream.AppendMode.APPEND, true, true)) {
            stroke(cs, MARGIN, 48, PAGE_WIDTH - MARGIN, 48, LINE, 0.7f);
            text(cs, "Cidadão Informa - transparência e rastreabilidade pública", MARGIN, 31, 7.5f, regular, MUTED);
            textRight(cs, "Página " + pageNumber + " de " + pageCount + " | v" + s.version(),
                    PAGE_WIDTH - MARGIN, 31, 7.5f, bold, NAVY);
        }
    }

    private float wrappedText(PDPageContentStream cs, String value, float x, float y, float width,
                              float size, PDType1Font font, Color color, float leading, int maxLines) throws Exception {
        List<String> lines = wrap(value, font, size, width);
        int count = Math.min(lines.size(), maxLines);
        for (int i = 0; i < count; i++) {
            String line = lines.get(i);
            if (i == count - 1 && lines.size() > maxLines) line = ellipsize(line, font, size, width);
            text(cs, line, x, y - (i * leading), size, font, color);
        }
        return y - (count * leading);
    }

    private List<String> wrap(String value, PDType1Font font, float size, float width) throws Exception {
        List<String> lines = new ArrayList<>();
        for (String paragraph : safe(value).split("\\R", -1)) {
            StringBuilder current = new StringBuilder();
            for (String word : paragraph.trim().split("\\s+")) {
                if (word.isBlank()) continue;
                String candidate = current.isEmpty() ? word : current + " " + word;
                if (stringWidth(font, candidate, size) <= width) {
                    current = new StringBuilder(candidate);
                } else {
                    if (!current.isEmpty()) lines.add(current.toString());
                    current = new StringBuilder(word);
                }
            }
            if (!current.isEmpty()) lines.add(current.toString());
        }
        if (lines.isEmpty()) lines.add("Não informado");
        return lines;
    }

    private String ellipsize(String value, PDType1Font font, float size, float width) throws Exception {
        String result = value;
        while (!result.isEmpty() && stringWidth(font, result + "...", size) > width) {
            result = result.substring(0, result.length() - 1);
        }
        return result + "...";
    }

    private void fitText(PDPageContentStream cs, String value, float x, float y, float width,
                         float preferredSize, PDType1Font font, Color color) throws Exception {
        float size = preferredSize;
        while (size > 7 && stringWidth(font, value, size) > width) size -= 0.5f;
        String safeValue = safe(value);
        if (stringWidth(font, safeValue, size) > width) safeValue = ellipsize(safeValue, font, size, width);
        text(cs, safeValue, x, y, size, font, color);
    }

    private void text(PDPageContentStream cs, String value, float x, float y, float size,
                      PDType1Font font, Color color) throws Exception {
        cs.beginText();
        cs.setFont(font, size);
        cs.setNonStrokingColor(color);
        cs.newLineAtOffset(x, y);
        cs.showText(safe(value));
        cs.endText();
    }

    private void textRight(PDPageContentStream cs, String value, float right, float y, float size,
                           PDType1Font font, Color color) throws Exception {
        text(cs, value, right - stringWidth(font, value, size), y, size, font, color);
    }

    private float stringWidth(PDType1Font font, String value, float size) throws Exception {
        return font.getStringWidth(safe(value)) / 1000f * size;
    }

    private void fill(PDPageContentStream cs, float x, float y, float w, float h, Color color) throws Exception {
        cs.setNonStrokingColor(color);
        cs.addRect(x, y, w, h);
        cs.fill();
    }

    private void stroke(PDPageContentStream cs, float x1, float y1, float x2, float y2,
                        Color color, float width) throws Exception {
        cs.setStrokingColor(color);
        cs.setLineWidth(width);
        cs.moveTo(x1, y1);
        cs.lineTo(x2, y2);
        cs.stroke();
    }

    private void strokeRect(PDPageContentStream cs, float x, float y, float w, float h,
                            Color color, float width) throws Exception {
        cs.setStrokingColor(color);
        cs.setLineWidth(width);
        cs.addRect(x, y, w, h);
        cs.stroke();
    }

    private String safe(String value) {
        if (value == null || value.isBlank()) return "Não informado";
        String normalized = value
                .replace('–', '-')
                .replace('—', '-')
                .replace('“', '"')
                .replace('”', '"')
                .replace('’', '\'')
                .replace("\u00A0", " ");
        byte[] bytes = normalized.getBytes(StandardCharsets.ISO_8859_1);
        return new String(bytes, StandardCharsets.ISO_8859_1).replace('?', '?');
    }

    private String currency(BigDecimal value) {
        return value == null ? "Não informado" : BRL.format(value.setScale(2, RoundingMode.HALF_UP));
    }

    private String date(Instant value) {
        return value == null ? "Não informado" : DATE.format(value.atZone(BRASILIA));
    }

    private String dateTime(Instant value) {
        return value == null ? "Não informado" : DATE_TIME.format(value.atZone(BRASILIA));
    }

    private String value(String value) {
        return value == null || value.isBlank() ? "Não informado" : value.trim();
    }

    private String label(String status) {
        return switch (value(status)) {
            case "Resolved", "Closed" -> "Concluído";
            default -> value(status);
        };
    }

    private String shortId(String id) {
        if (id == null) return "--------";
        return id.substring(0, Math.min(id.length(), 8)).toUpperCase(Locale.ROOT);
    }

    private String maskCpf(String cpf) {
        if (cpf == null || cpf.isBlank()) return "Não informado";
        String digits = cpf.replaceAll("\\D", "");
        if (digits.length() != 11) return cpf;
        return digits.substring(0, 3) + "." + digits.substring(3, 6) + "." + digits.substring(6, 9) + "-" + digits.substring(9);
    }

    private String groupedHash(String hash) {
        if (hash == null || hash.isBlank()) return "Não disponível";
        return hash.replaceAll("(.{8})(?!$)", "$1 ");
    }

    private String first(List<String> values) {
        return values == null || values.isEmpty() ? null : values.getFirst();
    }
}
