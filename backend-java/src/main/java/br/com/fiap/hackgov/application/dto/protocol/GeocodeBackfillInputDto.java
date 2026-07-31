package br.com.fiap.hackgov.application.dto.protocol;

/** Tamanho do lote de geocodificacao. null usa o padrao do servico. */
public record GeocodeBackfillInputDto(Integer limit) {
}
