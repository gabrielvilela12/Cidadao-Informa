package br.com.fiap.hackgov.application.usecase.auth;

import br.com.fiap.hackgov.application.dto.auth.AuthOutputDto;
import br.com.fiap.hackgov.application.dto.auth.RegisterInputDto;
import br.com.fiap.hackgov.application.service.JwtService;
import br.com.fiap.hackgov.application.service.RegionalCampaignRoutingService;
import br.com.fiap.hackgov.application.util.AuthUtils;
import br.com.fiap.hackgov.domain.campaign.RegionalCampaign;
import br.com.fiap.hackgov.domain.entity.User;
import br.com.fiap.hackgov.domain.entity.UserResidenceProof;
import br.com.fiap.hackgov.domain.repository.UserRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaUserResidenceProofRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class RegisterUseCase {

    private static final int MAX_RESIDENCE_PROOF_DATA_URL_LENGTH = 4_200_000;
    private static final Pattern RESIDENCE_PROOF_PATTERN = Pattern.compile(
            "^data:(application/pdf|image/(jpeg|png|webp));base64,[a-zA-Z0-9+/=\\r\\n]+$"
    );

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final RegionalCampaignRoutingService campaignRoutingService;
    private final JpaUserResidenceProofRepository residenceProofRepository;

    public RegisterUseCase(
            UserRepository userRepository,
            JwtService jwtService,
            RegionalCampaignRoutingService campaignRoutingService,
            JpaUserResidenceProofRepository residenceProofRepository
    ) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.campaignRoutingService = campaignRoutingService;
        this.residenceProofRepository = residenceProofRepository;
    }

    @Transactional
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

        String residenceState = normalizeResidenceState(input.residenceState());
        String residenceCity = requiredTrimmed(input.residenceCity(), "Informe sua cidade.");
        String residenceAddress = requiredTrimmed(input.residenceAddress(), "Informe seu endereço residencial.");
        ResidenceProof residenceProof = validateResidenceProof(
                input.residenceProofFileName(),
                input.residenceProofDataUrl()
        );

        if (userRepository.getByCpf(input.cpf()).isPresent()) {
            throw new IllegalArgumentException("Já existe uma conta cadastrada com este CPF.");
        }

        if (userRepository.getByEmail(normalizedEmail).isPresent()) {
            throw new IllegalArgumentException("Já existe uma conta cadastrada com este E-mail.");
        }

        RegionalCampaign campaign = campaignRoutingService.resolveActiveCampaignForRegistration(
                residenceCity,
                residenceAddress,
                residenceState
        );

        User user = new User();
        user.setName(input.name());
        user.setEmail(normalizedEmail);
        user.setCpf(input.cpf());
        user.setPasswordHash(AuthUtils.hashPassword(input.password()));
        user.setRole("citizen");
        user.setResidenceState(residenceState);
        user.setResidenceCity(residenceCity);
        user.setResidenceAddress(residenceAddress);
        user.setEstablishmentId(campaign.getEstablishmentId());

        User createdUser = userRepository.add(user);
        UserResidenceProof proof = new UserResidenceProof();
        proof.setUserId(createdUser.getId());
        proof.setFileName(residenceProof.fileName());
        proof.setContentType(residenceProof.contentType());
        proof.setDataUrl(residenceProof.dataUrl());
        residenceProofRepository.save(proof);

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
                campaign.getEstablishment() == null || campaign.getEstablishment().isChatEnabled(),
                createdUser.getId(),
                createdUser.getCreatedAt()
        );
    }

    private String normalizeResidenceState(String value) {
        String state = requiredTrimmed(value, "Informe sua UF.");
        state = state.toUpperCase(Locale.ROOT);
        if (!state.matches("[A-Z]{2}")) {
            throw new IllegalArgumentException("Informe uma UF válida.");
        }
        return state;
    }

    private String requiredTrimmed(String value, String message) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return normalized;
    }

    private ResidenceProof validateResidenceProof(String fileName, String value) {
        String dataUrl = requiredTrimmed(value, "Envie um comprovante de residência.");
        if (dataUrl.length() > MAX_RESIDENCE_PROOF_DATA_URL_LENGTH) {
            throw new IllegalArgumentException("O comprovante de residência deve ter até 3 MB.");
        }
        var matcher = RESIDENCE_PROOF_PATTERN.matcher(dataUrl);
        if (!matcher.matches()) {
            throw new IllegalArgumentException("Envie um comprovante em PDF, JPG, PNG ou WebP.");
        }
        return new ResidenceProof(normalizeFileName(fileName), matcher.group(1), dataUrl);
    }

    private String normalizeFileName(String value) {
        if (value == null || value.isBlank()) {
            return "comprovante-residencia";
        }
        String normalized = value.trim();
        return normalized.length() > 180 ? normalized.substring(0, 180) : normalized;
    }

    private record ResidenceProof(String fileName, String contentType, String dataUrl) {
    }
}
