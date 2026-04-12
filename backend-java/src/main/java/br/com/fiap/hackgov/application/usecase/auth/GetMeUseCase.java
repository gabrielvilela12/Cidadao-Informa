package br.com.fiap.hackgov.application.usecase.auth;

import br.com.fiap.hackgov.application.dto.auth.AuthOutputDto;
import br.com.fiap.hackgov.domain.entity.User;
import br.com.fiap.hackgov.domain.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class GetMeUseCase {

    private final UserRepository userRepository;

    public GetMeUseCase(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public AuthOutputDto execute(String userId) {
        User user = userRepository.getById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado ou inativo."));

        return new AuthOutputDto(
                "",
                user.getName(),
                user.getEmail(),
                user.getCpf(),
                user.getRole(),
                user.getId(),
                user.getCreatedAt()
        );
    }
}
