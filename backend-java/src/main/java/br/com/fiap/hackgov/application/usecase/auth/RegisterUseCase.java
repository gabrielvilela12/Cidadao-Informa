package br.com.fiap.hackgov.application.usecase.auth;

import br.com.fiap.hackgov.application.dto.auth.AuthOutputDto;
import br.com.fiap.hackgov.application.dto.auth.RegisterInputDto;
import br.com.fiap.hackgov.application.service.JwtService;
import br.com.fiap.hackgov.application.util.AuthUtils;
import br.com.fiap.hackgov.domain.entity.Establishment;
import br.com.fiap.hackgov.domain.entity.User;
import br.com.fiap.hackgov.domain.repository.UserRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaEstablishmentRepository;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.Locale;

@Service
public class RegisterUseCase {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final JpaEstablishmentRepository establishmentRepository;

    public RegisterUseCase(
            UserRepository userRepository,
            JwtService jwtService,
            JpaEstablishmentRepository establishmentRepository
    ) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.establishmentRepository = establishmentRepository;
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

        String city = input.city() == null ? "" : input.city().trim().replaceAll("\\s+", " ");
        if (city.length() < 2 || city.length() > 120) {
            throw new IllegalArgumentException("Informe a cidade onde você mora.");
        }

        String state = input.state() == null ? "" : input.state().trim().toUpperCase(Locale.ROOT);
        if (!state.matches("[A-Z]{2}")) {
            throw new IllegalArgumentException("Informe uma UF válida.");
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
        user.setResidenceCity(city);
        user.setResidenceState(state);
        resolveEstablishment(city, state).ifPresent(establishment ->
                user.setEstablishmentId(establishment.getId()));

        User createdUser = userRepository.add(user);
        String token = jwtService.generateToken(createdUser);

        return new AuthOutputDto(
                token,
                createdUser.getName(),
                createdUser.getEmail(),
                createdUser.getCpf(),
                createdUser.getPhone(),
                createdUser.getRole(),
                createdUser.getEstablishmentId(),
                createdUser.getEstablishment() == null ? null : createdUser.getEstablishment().getName(),
                createdUser.getId(),
                createdUser.getCreatedAt()
        );
    }

    private java.util.Optional<Establishment> resolveEstablishment(String city, String state) {
        String normalizedCity = normalizeCity(city);
        return establishmentRepository
                .findByStateIgnoreCaseAndStatusIgnoreCaseOrderByCreatedAtDesc(state, "active")
                .stream()
                .filter(establishment -> normalizeCity(establishment.getCity()).equals(normalizedCity))
                .findFirst();
    }

    private String normalizeCity(String value) {
        return Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .trim()
                .replaceAll("\\s+", " ")
                .toLowerCase(Locale.ROOT);
    }
}
