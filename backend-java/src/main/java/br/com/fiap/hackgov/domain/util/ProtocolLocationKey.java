package br.com.fiap.hackgov.domain.util;

import java.text.Normalizer;
import java.util.Locale;

/**
 * Identificador estavel usado para reconhecer relatos do mesmo endereco.
 *
 * O formulario ja produz um endereco canonico. Esta normalizacao remove as
 * diferencas que nao mudam o local (acentos, caixa e pontuacao), permitindo que
 * protocolos antigos e novos sejam agrupados de forma consistente.
 */
public final class ProtocolLocationKey {

    private ProtocolLocationKey() {
    }

    public static String fromAddress(String address) {
        if (address == null || address.isBlank()) return null;

        String withoutAccents = Normalizer.normalize(address, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        String normalized = withoutAccents
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
        // Enderecos formados apenas por pontuacao sao dados ruins, mas ainda
        // nao podem violar a coluna NOT NULL. A chave vazia fica fora dos grupos.
        return normalized;
    }
}
