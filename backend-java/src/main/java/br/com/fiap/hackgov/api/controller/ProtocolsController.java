package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.api.response.ErrorResponse;
import br.com.fiap.hackgov.application.dto.protocol.ProtocolInputDto;
import br.com.fiap.hackgov.application.dto.protocol.ProtocolOutputDto;
import br.com.fiap.hackgov.application.dto.protocol.ProtocolStatusUpdateInputDto;
import br.com.fiap.hackgov.application.dto.protocol.GeocodeBackfillInputDto;
import br.com.fiap.hackgov.application.dto.protocol.PublicProtocolOutputDto;
import br.com.fiap.hackgov.application.service.AiPriorityService;
import br.com.fiap.hackgov.application.service.AiImageCorrectionService;
import br.com.fiap.hackgov.application.service.GeocodingService;
import br.com.fiap.hackgov.application.service.ProtocolAuditService;
import br.com.fiap.hackgov.application.usecase.protocol.CreateProtocolUseCase;
import br.com.fiap.hackgov.application.usecase.protocol.GetPublicStatsUseCase;
import br.com.fiap.hackgov.application.usecase.protocol.GetProtocolsUseCase;
import br.com.fiap.hackgov.domain.entity.Protocol;
import br.com.fiap.hackgov.domain.repository.ProtocolRepository;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/protocols")
public class ProtocolsController {

    private static final Set<String> ALLOWED_STATUSES = Set.of(
            "Aberto",
            "Em Análise",
            "Concluído",
            "Atrasado"
    );

    private final CreateProtocolUseCase createProtocolUseCase;
    private final GetProtocolsUseCase getProtocolsUseCase;
    private final GetPublicStatsUseCase getPublicStatsUseCase;
    private final ProtocolRepository protocolRepository;
    private final ProtocolAuditService auditService;
    private final AiPriorityService aiPriorityService;
    private final AiImageCorrectionService aiImageCorrectionService;
    private final GeocodingService geocodingService;

    public ProtocolsController(
            CreateProtocolUseCase createProtocolUseCase,
            GetProtocolsUseCase getProtocolsUseCase,
            GetPublicStatsUseCase getPublicStatsUseCase,
            ProtocolRepository protocolRepository,
            ProtocolAuditService auditService,
            AiPriorityService aiPriorityService,
            AiImageCorrectionService aiImageCorrectionService,
            GeocodingService geocodingService
    ) {
        this.createProtocolUseCase = createProtocolUseCase;
        this.getProtocolsUseCase = getProtocolsUseCase;
        this.getPublicStatsUseCase = getPublicStatsUseCase;
        this.protocolRepository = protocolRepository;
        this.auditService = auditService;
        this.aiPriorityService = aiPriorityService;
        this.aiImageCorrectionService = aiImageCorrectionService;
        this.geocodingService = geocodingService;
    }

    @PostMapping
    public ResponseEntity<?> createProtocol(
            @RequestBody ProtocolInputDto input,
            Authentication authentication
    ) {
        try {
            AuthenticatedUser user = requireUser(authentication);
            ProtocolOutputDto created = createProtocolUseCase.execute(
                    input,
                    user.userId(),
                    user.name()
            );

            auditService.append(
                    created.id(),
                    "PROTOCOL_CREATED",
                    user.userId(),
                    user.role(),
                    null,
                    created.status(),
                    Map.of(
                            "category", created.category(),
                            "status", created.status(),
                            "description_hash", auditService.hashValue(created.description()),
                            "address_hash", auditService.hashValue(created.address()),
                            "requester_hash", auditService.hashValue(created.requester()),
                            "image_count", created.imageUrls().size()
                    )
            );

            aiPriorityService.createPriorityJob(
                    created.id(),
                    created.description(),
                    created.category()
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getProtocols(Authentication authentication) {
        try {
            AuthenticatedUser user = requireUser(authentication);
            String userId = isAdmin(user) ? null : user.userId();
            return ResponseEntity.ok(getProtocolsUseCase.execute(userId));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse(ex.getMessage()));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getPublicStats() {
        return ResponseEntity.ok(getPublicStatsUseCase.execute());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProtocol(
            @PathVariable String id,
            Authentication authentication
    ) {
        try {
            AuthenticatedUser user = requireUser(authentication);
            Protocol protocol = findProtocol(id);
            if (!isAdmin(user) && !protocol.getUserId().equals(user.userId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ErrorResponse("Você não tem acesso a este protocolo."));
            }
            return ResponseEntity.ok(ProtocolOutputDto.from(protocol));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(ex.getMessage()));
        }
    }

    @GetMapping("/public/{id}")
    public ResponseEntity<?> getPublicProtocol(@PathVariable String id) {
        try {
            return ResponseEntity.ok(PublicProtocolOutputDto.from(findProtocol(id)));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(ex.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable String id,
            @RequestBody ProtocolStatusUpdateInputDto input,
            Authentication authentication
    ) {
        try {
            AuthenticatedUser user = requireAdmin(authentication);
            if (input.status() == null || !ALLOWED_STATUSES.contains(input.status())) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Status inválido."));
            }

            Protocol protocol = findProtocol(id);
            String previousStatus = protocol.getStatus();
            protocol.setStatus(input.status());
            Protocol updated = protocolRepository.update(protocol);

            auditService.append(
                    id,
                    "STATUS_CHANGED",
                    user.userId(),
                    user.role(),
                    previousStatus,
                    updated.getStatus(),
                    Map.of(
                            "reason_hash",
                            input.reason() == null || input.reason().isBlank()
                                    ? ""
                                    : auditService.hashValue(input.reason().trim())
                    )
            );

            return ResponseEntity.ok(ProtocolOutputDto.from(updated));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        }
    }

    @PostMapping("/{id}/ai-correction")
    public ResponseEntity<?> generateCorrectedImages(
            @PathVariable String id,
            Authentication authentication
    ) {
        try {
            AuthenticatedUser user = requireAdmin(authentication);
            Protocol updated = aiImageCorrectionService.generate(id);

            auditService.append(
                    id,
                    "AI_CORRECTION_GENERATED",
                    user.userId(),
                    user.role(),
                    updated.getStatus(),
                    updated.getStatus(),
                    Map.of(
                            "source_image_count", updated.getImageUrls().size(),
                            "generated_image_count", updated.getCorrectedImageUrls().size(),
                            "disclaimer", "illustrative_ai_simulation"
                    )
            );

            // O save devolve a entidade com o relacionamento de usuário já
            // destacado do contexto JPA. Recarregar aplica o EntityGraph do
            // repositório antes de montar o DTO (incluindo telefone/nome).
            return ResponseEntity.ok(ProtocolOutputDto.from(findProtocol(id)));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(new ErrorResponse(ex.getMessage()));
        }
    }

    /**
     * Preenche as coordenadas dos chamados abertos antes de a posicao do mapa
     * passar a ser gravada. Processa um lote por chamada (limite do Nominatim):
     * repita enquanto `remaining` for maior que zero.
     */
    @PostMapping("/geocode/backfill")
    public ResponseEntity<?> backfillCoordinates(
            @RequestBody(required = false) GeocodeBackfillInputDto input,
            Authentication authentication
    ) {
        try {
            requireAdmin(authentication);
            return ResponseEntity.ok(
                    geocodingService.backfill(input == null ? null : input.limit())
            );
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse(ex.getMessage()));
        }
    }

    @GetMapping("/{id}/audit")
    public ResponseEntity<?> getAuditTrail(
            @PathVariable String id,
            Authentication authentication
    ) {
        try {
            AuthenticatedUser user = requireUser(authentication);
            Protocol protocol = findProtocol(id);
            if (!isAdmin(user) && !protocol.getUserId().equals(user.userId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ErrorResponse("Você não tem acesso à auditoria deste protocolo."));
            }
            return ResponseEntity.ok(auditService.getProtocolTrail(id));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        }
    }

    @GetMapping("/audit/verify")
    public ResponseEntity<?> verifyAuditChain(Authentication authentication) {
        try {
            requireAdmin(authentication);
            return ResponseEntity.ok(auditService.verifyAll());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse(ex.getMessage()));
        }
    }

    private Protocol findProtocol(String id) {
        return protocolRepository.getById(id)
                .orElseThrow(() -> new IllegalArgumentException("Protocolo não encontrado."));
    }

    private AuthenticatedUser requireUser(Authentication authentication) {
        if (authentication == null
                || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
            throw new IllegalArgumentException("Sessão inválida ou expirada.");
        }
        return user;
    }

    private AuthenticatedUser requireAdmin(Authentication authentication) {
        AuthenticatedUser user = requireUser(authentication);
        if (!isAdmin(user)) {
            throw new IllegalArgumentException("Acesso restrito a administradores.");
        }
        return user;
    }

    private boolean isAdmin(AuthenticatedUser user) {
        return "admin".equalsIgnoreCase(user.role());
    }
}
