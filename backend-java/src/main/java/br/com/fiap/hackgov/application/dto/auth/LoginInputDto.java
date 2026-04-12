package br.com.fiap.hackgov.application.dto.auth;

public record LoginInputDto(
        String cpf,
        String password
) {
}
