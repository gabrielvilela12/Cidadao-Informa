package br.com.fiap.hackgov.application.usecase.auth;

import br.com.fiap.hackgov.application.dto.auth.AuthOutputDto;
import br.com.fiap.hackgov.application.dto.auth.RegisterInputDto;
import br.com.fiap.hackgov.application.service.JwtService;
import br.com.fiap.hackgov.application.service.RegionalCampaignRoutingService;
import br.com.fiap.hackgov.domain.campaign.RegionalCampaign;
import br.com.fiap.hackgov.domain.entity.User;
import br.com.fiap.hackgov.domain.entity.UserResidenceProof;
import br.com.fiap.hackgov.domain.repository.UserRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaUserResidenceProofRepository;
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

    @Mock
    private RegionalCampaignRoutingService campaignRoutingService;

    @Mock
    private JpaUserResidenceProofRepository residenceProofRepository;

    @InjectMocks
    private RegisterUseCase registerUseCase;

    @Test
    void shouldRegisterUserWithNormalizedEmailAndCitizenRole() {
        RegisterInputDto input = new RegisterInputDto(
                "Gabriel Vilela",
                "GABRIEL@EMAIL.COM ",
                "12345678901",
                "Senha@123",
                "sp",
                "Ribeirão Preto",
                "Rua das Flores, 123 - Centro, Ribeirão Preto - SP",
                "conta-luz.pdf",
                "data:application/pdf;base64,JVBERi0x"
        );
        RegionalCampaign campaign = new RegionalCampaign();
        campaign.setEstablishmentId("establishment-123");

        when(userRepository.getByCpf(input.cpf())).thenReturn(Optional.empty());
        when(userRepository.getByEmail("gabriel@email.com")).thenReturn(Optional.empty());
        when(campaignRoutingService.resolveActiveCampaignForRegistration(
                "Ribeirão Preto",
                "Rua das Flores, 123 - Centro, Ribeirão Preto - SP",
                "SP"
        )).thenReturn(campaign);
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
        ArgumentCaptor<UserResidenceProof> proofCaptor = ArgumentCaptor.forClass(UserResidenceProof.class);
        verify(residenceProofRepository).save(proofCaptor.capture());
        UserResidenceProof proof = proofCaptor.getValue();

        assertEquals("gabriel@email.com", createdUser.getEmail());
        assertEquals("citizen", createdUser.getRole());
        assertEquals("SP", createdUser.getResidenceState());
        assertEquals("Ribeirão Preto", createdUser.getResidenceCity());
        assertEquals("Rua das Flores, 123 - Centro, Ribeirão Preto - SP", createdUser.getResidenceAddress());
        assertEquals("establishment-123", createdUser.getEstablishmentId());
        assertEquals("user-123", proof.getUserId());
        assertEquals("conta-luz.pdf", proof.getFileName());
        assertEquals("application/pdf", proof.getContentType());
        assertEquals("data:application/pdf;base64,JVBERi0x", proof.getDataUrl());
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
                "Senha@123",
                "SP",
                "Ribeirão Preto",
                "Rua das Flores, 123 - Centro, Ribeirão Preto - SP",
                "comprovante.png",
                "data:image/png;base64,iVBORw0KGgo="
        );

        when(userRepository.getByCpf(input.cpf())).thenReturn(Optional.of(new User()));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> registerUseCase.execute(input)
        );

        assertEquals("Já existe uma conta cadastrada com este CPF.", exception.getMessage());
    }

    @Test
    void shouldRejectMissingResidenceProof() {
        RegisterInputDto input = new RegisterInputDto(
                "Gabriel Vilela",
                "gabriel@email.com",
                "12345678901",
                "Senha@123",
                "SP",
                "Ribeirão Preto",
                "Rua das Flores, 123 - Centro, Ribeirão Preto - SP",
                "comprovante.pdf",
                ""
        );

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> registerUseCase.execute(input)
        );

        assertEquals("Envie um comprovante de residência.", exception.getMessage());
    }
}
