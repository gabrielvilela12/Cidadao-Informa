package br.com.fiap.hackgov.application.dto.admin;

public record DataExportAuditInputDto(
        String resourceType,
        String format,
        int recordCount,
        String resourceId
) {
}
