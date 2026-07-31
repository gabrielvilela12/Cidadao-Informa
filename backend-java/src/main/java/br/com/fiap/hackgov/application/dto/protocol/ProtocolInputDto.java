package br.com.fiap.hackgov.application.dto.protocol;

public record ProtocolInputDto(
        String category,
        String description,
        String address,
        // Ponto que o solicitante marcou no mapa. Pode vir null quando o cliente
        // nao conseguiu confirmar a posicao; o par latitude/longitude e sempre
        // gravado junto ou nao gravado.
        Double latitude,
        Double longitude
) {
}
