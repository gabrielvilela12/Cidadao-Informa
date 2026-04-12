package br.com.fiap.hackgov.application.usecase.auth;

import br.com.fiap.hackgov.application.dto.auth.AuthOutputDto;
import br.com.fiap.hackgov.application.dto.auth.RegisterInputDto;
import br.com.fiap.hackgov.application.service.JwtService;
import br.com.fiap.hackgov.application.util.AuthUtils;
import br.com.fiap.hackgov.domain.entity.User;
import br.com.fiap.hackgov.domain.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class RegisterUseCase {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    public RegisterUseCase(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    public AuthOutputDto execute(RegisterInputDto input) {
        if (input.name() == null || input.name().isBlank()) {
            throw new IllegalArgumentException("O Nome Completo é obrigatório.");
        }

        if (input.cpf() == null || input.cpf().isBlank() || input.cpf().length() != 11) {
            throw new IllegalArgumentException("O CPF deve ter exatamente 11 dígitos.");
        }

        if (input.email() == null || input.email().isBlank() || !input.email().contains("@")) {
            throw new IllegalArgumentException("Por favor, informe um E-mail válido.");
        }

        String normalizedEmail = input.email().trim().toLowerCase();

        if (input.password() == null || input.password().isBlank() || input.password().length() < 6) {
            throw new IllegalArgumentException("A senha deve ter pelo menos 6 caracteres.");
        }

        if (userRepository.getByCpf(input.cpf()).isPresent()) {
            throw new IllegalArgumentException("Já existe uma conta cadastrada com este CPF.");
        }

        if (userRepository.getByEmail(normalizedEmail).isPresent()) {
            throw new IllegalArgumentException("Já existe uma conta cadastrada com este E-mail.");
        }

        User user = new User();
        user.setName(input.name());
        user.setEmail(normalizedEmail);
        user.setCpf(input.cpf());
        user.setPasswordHash(AuthUtils.hashPassword(input.password()));
        user.setRole("citizen");

        User createdUser = userRepository.add(user);
        String token = jwtService.generateToken(createdUser);

        return new AuthOutputDto(
                token,
                createdUser.getName(),
                createdUser.getEmail(),
                createdUser.getCpf(),
                createdUser.getRole(),
                createdUser.getId(),
                createdUser.getCreatedAt()
        );
    }
}
