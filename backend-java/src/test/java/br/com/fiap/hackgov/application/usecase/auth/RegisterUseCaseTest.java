package br.com.fiap.hackgov.application.usecase.auth;

import br.com.fiap.hackgov.application.dto.auth.AuthOutputDto;
import br.com.fiap.hackgov.application.dto.auth.RegisterInputDto;
import br.com.fiap.hackgov.application.service.JwtService;
import br.com.fiap.hackgov.domain.entity.User;
import br.com.fiap.hackgov.domain.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RegisterUseCaseTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private RegisterUseCase registerUseCase;

    @Test
    void shouldRegisterUserWithNormalizedEmailAndCitizenRole() {
        RegisterInputDto input = new RegisterInputDto(
                "Gabriel Vilela",
                "GABRIEL@EMAIL.COM ",
                "12345678901",
                "Senha@123"
        );

        when(userRepository.getByCpf(input.cpf())).thenReturn(Optional.empty());
        when(userRepository.getByEmail("gabriel@email.com")).thenReturn(Optional.empty());
        when(userRepository.add(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId("user-123");
            user.setCreatedAt(Instant.parse("2026-04-12T12:00:00Z"));
            return user;
        });
        when(jwtService.generateToken(any(User.class))).thenReturn("jwt-token");

        AuthOutputDto result = registerUseCase.execute(input);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).add(captor.capture());
        User createdUser = captor.getValue();

        assertEquals("gabriel@email.com", createdUser.getEmail());
        assertEquals("citizen", createdUser.getRole());
        assertNotEquals("Senha@123", createdUser.getPasswordHash());
        assertEquals("jwt-token", result.token());
        assertEquals("user-123", result.userId());
    }

    @Test
    void shouldRejectDuplicateCpf() {
        RegisterInputDto input = new RegisterInputDto(
                "Gabriel Vilela",
                "gabriel@email.com",
                "12345678901",
                "Senha@123"
        );

        when(userRepository.getByCpf(input.cpf())).thenReturn(Optional.of(new User()));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> registerUseCase.execute(input)
        );

        assertEquals("Já existe uma conta cadastrada com este CPF.", exception.getMessage());
    }
}
