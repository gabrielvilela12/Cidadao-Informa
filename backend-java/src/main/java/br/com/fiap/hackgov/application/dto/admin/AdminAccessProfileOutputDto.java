package br.com.fiap.hackgov.application.dto.admin;

import java.util.List;

public record AdminAccessProfileOutputDto(
        List<String> states,
        List<String> screens
) {
}
