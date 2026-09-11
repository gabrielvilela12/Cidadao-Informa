package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.application.dto.ai.AiChatSettingsOutputDto;
import br.com.fiap.hackgov.domain.entity.Establishment;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaEstablishmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AiChatSettingsService {

    private final JpaEstablishmentRepository establishmentRepository;

    public AiChatSettingsService(JpaEstablishmentRepository establishmentRepository) {
        this.establishmentRepository = establishmentRepository;
    }

    @Transactional(readOnly = true)
    public AiChatSettingsOutputDto get(String establishmentId) {
        return toOutput(requireEstablishment(establishmentId));
    }

    @Transactional
    public AiChatSettingsOutputDto update(String establishmentId, boolean chatEnabled) {
        Establishment establishment = requireEstablishment(establishmentId);
        establishment.setChatEnabled(chatEnabled);
        return toOutput(establishmentRepository.save(establishment));
    }

    @Transactional(readOnly = true)
    public void requireEnabled(String establishmentId) {
        if (!requireEstablishment(establishmentId).isChatEnabled()) {
            throw new IllegalArgumentException("O chatbot esta desativado para esta prefeitura.");
        }
    }

    private Establishment requireEstablishment(String establishmentId) {
        if (establishmentId == null || establishmentId.isBlank()) {
            throw new IllegalArgumentException("Usuario sem prefeitura vinculada.");
        }
        return establishmentRepository.findById(establishmentId)
                .orElseThrow(() -> new IllegalArgumentException("Prefeitura nao encontrada."));
    }

    private AiChatSettingsOutputDto toOutput(Establishment establishment) {
        return new AiChatSettingsOutputDto(
                establishment.getId(),
                establishment.getName(),
                establishment.isChatEnabled()
        );
    }
}
