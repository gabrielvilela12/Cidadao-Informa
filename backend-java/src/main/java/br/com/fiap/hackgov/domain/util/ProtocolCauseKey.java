package br.com.fiap.hackgov.domain.util;

/** Identifica a causa sem considerar os detalhes livres acrescentados pelo cidadão. */
public final class ProtocolCauseKey {

    private ProtocolCauseKey() {
    }

    public static String from(String category, String description) {
        if (category == null || category.isBlank() || description == null || description.isBlank()) {
            return null;
        }
        String reportedProblem = description.split("\\s+-\\s+", 2)[0];
        String normalizedCategory = ProtocolLocationKey.fromAddress(category);
        String normalizedProblem = ProtocolLocationKey.fromAddress(reportedProblem);
        if (normalizedCategory == null || normalizedCategory.isBlank()
                || normalizedProblem == null || normalizedProblem.isBlank()) {
            return null;
        }
        return normalizedCategory + "|" + normalizedProblem;
    }
}
