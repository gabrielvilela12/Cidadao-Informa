package br.com.fiap.hackgov.application.dto.auth;

public record RegisterInputDto(
        String name,
        String email,
        String cpf,
        String password
) {
}
