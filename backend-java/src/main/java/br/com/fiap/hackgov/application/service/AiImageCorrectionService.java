package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.domain.entity.Protocol;
import br.com.fiap.hackgov.domain.repository.ProtocolRepository;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

@Service
public class AiImageCorrectionService {

    private static final Logger LOGGER = LoggerFactory.getLogger(AiImageCorrectionService.class);
    private static final int MAX_IMAGES = 4;
    private static final int MAX_DATA_URL_LENGTH = 4_500_000;
    private static final int MAX_STORAGE_URL_LENGTH = 2_048;
    private static final int MAX_REPORT_LENGTH = 4_000;
    private static final int MAX_FUNCTION_RESPONSE_LENGTH =
            (MAX_DATA_URL_LENGTH * MAX_IMAGES) + MAX_REPORT_LENGTH + 20_000;

    private final ProtocolRepository protocolRepository;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String imageFunctionUrl;
    private final String storagePublicUrlPrefix;
    private final String supabaseAnonKey;
    private final String imageFunctionSecret;

    public AiImageCorrectionService(
            ProtocolRepository protocolRepository,
            RestClient restClient,
            ObjectMapper objectMapper,
            @Value("${app.supabase.edge-function-url}") String priorityFunctionUrl,
            @Value("${app.supabase.corrected-image-function-url:}") String configuredImageFunctionUrl,
            @Value("${app.supabase.anon-key}") String supabaseAnonKey,
            @Value("${app.ai.image-function-secret:}") String imageFunctionSecret
    ) {
        this.protocolRepository = protocolRepository;
        this.restClient = restClient;
        this.objectMapper = objectMapper;
        this.imageFunctionUrl = resolveImageFunctionUrl(priorityFunctionUrl, configuredImageFunctionUrl);
        this.storagePublicUrlPrefix = resolveStoragePublicUrlPrefix(this.imageFunctionUrl);
        this.supabaseAnonKey = supabaseAnonKey;
        this.imageFunctionSecret = imageFunctionSecret;
    }

    public Protocol generate(String protocolId) {
        Protocol protocol = getProtocol(protocolId);
        List<String> originals = protocol.getImageUrls();
        if (originals.isEmpty()) {
            throw new IllegalArgumentException("Este protocolo não possui fotos para corrigir.");
        }
        if (originals.size() > MAX_IMAGES) {
            throw new IllegalArgumentException("O protocolo excede o limite de fotos para geração.");
        }
        if (imageFunctionUrl.isBlank() || imageFunctionSecret.isBlank()) {
            throw new IllegalStateException("A geração de imagens por IA ainda não está configurada no servidor.");
        }

        protocol.setCorrectionStatus("processing");
        protocol.setCorrectionError(null);
        protocolRepository.update(protocol);

        try {
            CorrectionResponse response = requestCorrection(protocol, originals);
            List<String> correctedImages = validateResponse(response, originals.size());
            String correctionReport = validateReport(response);
            protocol.setCorrectedImageUrls(correctedImages);
            protocol.setCorrectionReport(correctionReport);
            protocol.setCorrectionStatus("success");
            protocol.setCorrectionError(null);
            protocol.setCorrectionGeneratedAt(Instant.now());
            LOGGER.info("Generated {} corrected images for protocol {}", correctedImages.size(), protocolId);
            return protocolRepository.update(protocol);
        } catch (Exception exception) {
            String message = safeErrorMessage(exception);
            protocol.setCorrectionStatus("failed");
            protocol.setCorrectionError(message);
            protocolRepository.update(protocol);
            LOGGER.error("Failed to generate corrected images for protocol {}: {}", protocolId, exception.getMessage());
            throw new IllegalStateException(message, exception);
        }
    }

    private Protocol getProtocol(String protocolId) {
        return protocolRepository.getById(protocolId)
                .orElseThrow(() -> new IllegalArgumentException("Protocolo não encontrado."));
    }

    private List<String> validateResponse(CorrectionResponse response, int originalCount) {
        if (response == null || !response.success()) {
            throw new IllegalStateException(response == null || response.error() == null
                    ? "A IA não retornou uma imagem corrigida."
                    : response.error());
        }

        List<String> images = response.imageUrls() == null ? List.of() : response.imageUrls();
        if (images.isEmpty() || images.size() != originalCount || images.size() > MAX_IMAGES) {
            throw new IllegalStateException("A IA retornou uma quantidade inesperada de imagens.");
        }

        for (int index = 0; index < images.size(); index++) {
            String image = images.get(index);
            if (image == null || !isSupportedImageReference(image, storagePublicUrlPrefix)) {
                throw new IllegalStateException("A IA retornou uma imagem em formato inválido.");
            }
            if (isSupportedImageDataUrl(image) && image.length() > MAX_DATA_URL_LENGTH) {
                LOGGER.warn(
                        "AI correction image {} rejected for protocol payload: {} characters exceeds limit {}",
                        index + 1,
                        image.length(),
                        MAX_DATA_URL_LENGTH
                );
                throw new IllegalStateException(
                        "A imagem corrigida ficou maior que o limite permitido. Tente gerar novamente."
                );
            }
            if (isSupportedStorageUrl(image, storagePublicUrlPrefix) && image.length() > MAX_STORAGE_URL_LENGTH) {
                throw new IllegalStateException("A IA retornou uma URL de imagem maior que o permitido.");
            }
        }
        return List.copyOf(images);
    }

    static boolean isSupportedImageDataUrl(String image) {
        return image.regionMatches(true, 0, "data:image/jpeg;base64,", 0, "data:image/jpeg;base64,".length())
                || image.regionMatches(true, 0, "data:image/png;base64,", 0, "data:image/png;base64,".length())
                || image.regionMatches(true, 0, "data:image/webp;base64,", 0, "data:image/webp;base64,".length());
    }

    static boolean isSupportedImageReference(String image, String storagePublicUrlPrefix) {
        return isSupportedImageDataUrl(image) || isSupportedStorageUrl(image, storagePublicUrlPrefix);
    }

    static boolean isSupportedStorageUrl(String image, String storagePublicUrlPrefix) {
        return image != null
                && storagePublicUrlPrefix != null
                && !storagePublicUrlPrefix.isBlank()
                && image.length() <= MAX_STORAGE_URL_LENGTH
                && image.regionMatches(true, 0, storagePublicUrlPrefix, 0, storagePublicUrlPrefix.length())
                && !image.contains("\r")
                && !image.contains("\n")
                && !image.contains(" ");
    }

    private CorrectionResponse requestCorrection(Protocol protocol, List<String> originals) {
        return restClient.post()
                .uri(imageFunctionUrl)
                .header("apikey", supabaseAnonKey)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + supabaseAnonKey)
                .header("x-ai-function-secret", imageFunctionSecret)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new CorrectionRequest(
                        protocol.getId(),
                        protocol.getCategory(),
                        protocol.getDescription(),
                        originals
                ))
                .exchange((request, response) -> parseCorrectionResponse(
                        response.getStatusCode(),
                        StreamUtils.copyToString(response.getBody(), StandardCharsets.UTF_8)
                ));
    }

    private CorrectionResponse parseCorrectionResponse(HttpStatusCode statusCode, String body) {
        if (body == null || body.isBlank()) {
            throw new IllegalStateException("O serviço de geração por IA retornou uma resposta vazia.");
        }

        if (body.length() > MAX_FUNCTION_RESPONSE_LENGTH) {
            throw new IllegalStateException(
                    "A imagem corrigida ficou maior que o limite permitido. Tente gerar novamente."
            );
        }

        CorrectionResponse response;
        try {
            response = objectMapper.readValue(body, CorrectionResponse.class);
        } catch (Exception exception) {
            LOGGER.warn("Invalid AI correction response body: {}", summarizeBody(body));
            throw new IllegalStateException(
                    "O serviço de geração por IA retornou uma resposta inválida. Tente novamente.",
                    exception
            );
        }

        if (!statusCode.is2xxSuccessful()) {
            throw new IllegalStateException(response == null || response.error() == null || response.error().isBlank()
                    ? "O serviço de geração por IA não conseguiu processar a imagem."
                    : response.error());
        }

        return response;
    }

    private static String summarizeBody(String body) {
        if (body == null) return "";
        String normalized = body.replaceAll("\\s+", " ").trim();
        return normalized.length() <= 300 ? normalized : normalized.substring(0, 300) + "...";
    }

    private String validateReport(CorrectionResponse response) {
        String report = response.correctionReport();
        if (report == null || report.isBlank()) {
            throw new IllegalStateException("A IA não retornou o relatório da correção.");
        }
        String normalizedReport = report.trim();
        if (normalizedReport.length() > MAX_REPORT_LENGTH) {
            throw new IllegalStateException("A IA retornou um relatório maior que o permitido.");
        }
        return normalizedReport;
    }

    private static String safeErrorMessage(Exception exception) {
        String message = exception.getMessage();
        if (message == null || message.isBlank()) {
            return "Não foi possível gerar a simulação corrigida.";
        }
        String normalizedMessage = message.toLowerCase();
        if (normalizedMessage.contains("404 not found")
                || normalizedMessage.contains("requested function was not found")) {
            return "O serviço de geração por IA ainda não foi publicado no Supabase.";
        }
        if (normalizedMessage.contains("401 unauthorized")
                || normalizedMessage.contains("403 forbidden")) {
            return "O serviço de geração por IA não está autorizado. Verifique a configuração do Supabase.";
        }
        if (message.length() > 500) {
            return "Não foi possível gerar a simulação corrigida. Tente novamente mais tarde.";
        }
        return message;
    }

    private static String resolveImageFunctionUrl(String priorityFunctionUrl, String configuredUrl) {
        if (configuredUrl != null && !configuredUrl.isBlank()) {
            return configuredUrl.trim();
        }
        if (priorityFunctionUrl == null || priorityFunctionUrl.isBlank()) {
            return "";
        }
        int lastSlash = priorityFunctionUrl.lastIndexOf('/');
        if (lastSlash < 0) return "";
        return priorityFunctionUrl.substring(0, lastSlash + 1) + "generate-corrected-image";
    }

    private static String resolveStoragePublicUrlPrefix(String imageFunctionUrl) {
        if (imageFunctionUrl == null || imageFunctionUrl.isBlank()) return "";
        String marker = "/functions/v1/";
        int markerIndex = imageFunctionUrl.indexOf(marker);
        if (markerIndex < 0) return "";
        return imageFunctionUrl.substring(0, markerIndex) + "/storage/v1/object/public/";
    }

    private record CorrectionRequest(
        @JsonProperty("protocol_id") String protocolId,
        String category,
        String description,
        List<String> images
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record CorrectionResponse(
            boolean success,
            @JsonProperty("image_urls") List<String> imageUrls,
            @JsonProperty("correction_report") String correctionReport,
            String error
    ) {
    }
}
