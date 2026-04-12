package br.com.fiap.hackgov.application.usecase.auth;

import br.com.fiap.hackgov.application.dto.auth.AuthOutputDto;
import br.com.fiap.hackgov.application.dto.auth.LoginInputDto;
import br.com.fiap.hackgov.application.service.JwtService;
import br.com.fiap.hackgov.application.util.AuthUtils;
import br.com.fiap.hackgov.domain.entity.User;
import br.com.fiap.hackgov.domain.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class LoginUseCase {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    public LoginUseCase(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    public AuthOutputDto execute(LoginInputDto input) {
        User user = userRepository.getByCpf(input.cpf())
                .orElseThrow(() -> new IllegalArgumentException("CPF ou senha inválidos."));

        if (!AuthUtils.verifyPassword(input.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("CPF ou senha inválidos.");
        }

        String token = jwtService.generateToken(user);

        return new AuthOutputDto(
                token,
                user.getName(),
                user.getEmail(),
                user.getCpf(),
                user.getRole(),
                user.getId(),
                user.getCreatedAt()
        );
    }
}
