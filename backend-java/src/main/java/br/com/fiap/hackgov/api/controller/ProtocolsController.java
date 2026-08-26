package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.api.response.ErrorResponse;
import br.com.fiap.hackgov.application.dto.protocol.ProtocolInputDto;
import br.com.fiap.hackgov.application.dto.protocol.ProtocolOutputDto;
import br.com.fiap.hackgov.application.dto.protocol.ProtocolStatusUpdateInputDto;
import br.com.fiap.hackgov.application.dto.protocol.GeocodeBackfillInputDto;
import br.com.fiap.hackgov.application.dto.protocol.PublicProtocolOutputDto;
import br.com.fiap.hackgov.application.dto.protocol.ProtocolSummaryOutputDto;
import br.com.fiap.hackgov.application.service.AiPriorityService;
import br.com.fiap.hackgov.application.service.AiImageCorrectionService;
import br.com.fiap.hackgov.application.service.GeocodingService;
import br.com.fiap.hackgov.application.service.ProtocolAuditService;
import br.com.fiap.hackgov.application.service.ProtocolEventService;
import br.com.fiap.hackgov.application.service.ProtocolLocationGroupService;
import br.com.fiap.hackgov.application.service.ServerStatePermissionService;
import br.com.fiap.hackgov.application.usecase.protocol.CreateProtocolUseCase;
import br.com.fiap.hackgov.application.usecase.protocol.GetPublicStatsUseCase;
import br.com.fiap.hackgov.application.usecase.protocol.GetProtocolsUseCase;
import br.com.fiap.hackgov.application.validation.ProtocolCompletionCostPolicy;
import br.com.fiap.hackgov.domain.entity.Protocol;
import br.com.fiap.hackgov.domain.repository.ProtocolRepository;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import br.com.fiap.hackgov.infrastructure.security.RoleAccess;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
    private final ProtocolEventService protocolEventService;
    private final ProtocolLocationGroupService locationGroupService;
    private final ServerStatePermissionService permissionService;

    public ProtocolsController(
            CreateProtocolUseCase createProtocolUseCase,
            GetProtocolsUseCase getProtocolsUseCase,
            GetPublicStatsUseCase getPublicStatsUseCase,
            ProtocolRepository protocolRepository,
            ProtocolAuditService auditService,
            AiPriorityService aiPriorityService,
            AiImageCorrectionService aiImageCorrectionService,
            GeocodingService geocodingService,
            ProtocolEventService protocolEventService,
            ProtocolLocationGroupService locationGroupService,
            ServerStatePermissionService permissionService
    ) {
        this.createProtocolUseCase = createProtocolUseCase;
        this.getProtocolsUseCase = getProtocolsUseCase;
        this.getPublicStatsUseCase = getPublicStatsUseCase;
        this.protocolRepository = protocolRepository;
        this.auditService = auditService;
        this.aiPriorityService = aiPriorityService;
        this.aiImageCorrectionService = aiImageCorrectionService;
        this.geocodingService = geocodingService;
        this.protocolEventService = protocolEventService;
        this.locationGroupService = locationGroupService;
        this.permissionService = permissionService;
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
                    user.name(),
                    user.establishmentId()
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

            protocolEventService.publishCreated(ProtocolSummaryOutputDto.from(created));

            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getProtocols(Authentication authentication) {
        try {
            AuthenticatedUser user = requireUser(authentication);
            if (!isAdmin(user)) {
                return ResponseEntity.ok(getProtocolsUseCase.execute(user.userId(), null, false));
            }
            if (hasEstablishmentScope(user)) {
                return ResponseEntity.ok(getProtocolsUseCase.executeForAdminByEstablishment(user.establishmentId()));
            }
            return ResponseEntity.ok(getProtocolsUseCase.executeForAdmin(permissionService.allowedStates(user.userId())));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse(ex.getMessage()));
        }
    }

    @GetMapping(value = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> streamProtocolEvents(Authentication authentication) {
        try {
            AuthenticatedUser admin = requireAdmin(authentication);
            return ResponseEntity.ok()
                    .header("Cache-Control", "no-cache, no-transform")
                    .header("X-Accel-Buffering", "no")
                    .body(protocolEventService.subscribe(permissionService.allowedStates(admin.userId())));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, exception.getMessage());
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
            Set<String> allowedStates = isAdmin(user)
                    ? permissionService.allowedStates(user.userId())
                    : Set.of();
            if (!canAccessProtocol(user, protocol, allowedStates)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ErrorResponse("Você não tem acesso a este protocolo."));
            }
            return ResponseEntity.ok(isAdmin(user)
                    ? detailsForAdmin(user, protocol, allowedStates)
                    : ProtocolOutputDto.from(protocol));
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
    @Transactional
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
            Set<String> allowedStates = permissionService.allowedStates(user.userId());
            if (!canAccessProtocol(user, protocol, allowedStates)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ErrorResponse("Você não tem acesso a este protocolo."));
            }

            List<Protocol> synchronizedProtocols = locationGroupService.membersForStatusSync(protocol)
                    .stream()
                    .filter(member -> canAccessProtocol(user, member, allowedStates))
                    .toList();
            BigDecimal resolutionCost = ProtocolCompletionCostPolicy.validate(
                    input.status(),
                    input.resolutionCost()
            );
            String primaryProtocolId = synchronizedProtocols.getFirst().getId();

            for (Protocol member : synchronizedProtocols) {
                String previousStatus = member.getStatus();
                boolean isPrimary = Objects.equals(member.getId(), primaryProtocolId);
                boolean costChanged = isPrimary && resolutionCost != null
                        && !Objects.equals(member.getResolutionCost(), resolutionCost);
                if (Objects.equals(previousStatus, input.status()) && !costChanged) continue;

                member.setStatus(input.status());
                // Uma unica correcao fisica pode ter muitos denunciantes. O custo
                // fica no protocolo principal para nao inflar os gastos agregados.
                if (isPrimary && resolutionCost != null) member.setResolutionCost(resolutionCost);
                protocolRepository.update(member);

                Map<String, Object> evidence = new LinkedHashMap<>();
                evidence.put(
                        "reason_hash",
                        input.reason() == null || input.reason().isBlank()
                                ? ""
                                : auditService.hashValue(input.reason().trim())
                );
                evidence.put("location_group_size", synchronizedProtocols.size());
                evidence.put("location_group_primary_protocol", primaryProtocolId);
                evidence.put("status_propagated_from", id);
                if (isPrimary && resolutionCost != null) evidence.put("resolution_cost", resolutionCost);

                auditService.append(
                        member.getId(),
                        Objects.equals(previousStatus, input.status())
                                ? "RESOLUTION_COST_RECORDED"
                                : "STATUS_CHANGED",
                        user.userId(),
                        user.role(),
                        previousStatus,
                        input.status(),
                        evidence
                );
            }

            // `save()` pode devolver uma instância mesclada cuja relação lazy
            // com o cidadão já ficou fora da sessão do repositório. Recarregar
            // pelo método com EntityGraph evita um 500 depois de a alteração e
            // o bloco de auditoria já terem sido persistidos com sucesso.
            return ResponseEntity.ok(detailsForAdmin(user, findProtocol(id), allowedStates));
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
            Protocol protocol = findProtocol(id);
            if (!canAccessProtocol(user, protocol, permissionService.allowedStates(user.userId()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ErrorResponse("Você não tem acesso a este protocolo."));
            }
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
            AuthenticatedUser admin = requireAdmin(authentication);
            requireAllStates(admin);
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
            Set<String> allowedStates = isAdmin(user)
                    ? permissionService.allowedStates(user.userId())
                    : Set.of();
            if (!canAccessProtocol(user, protocol, allowedStates)) {
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
            AuthenticatedUser admin = requireAdmin(authentication);
            requireAllStates(admin);
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
        return RoleAccess.isAdministrative(user.role());
    }

    private void requireAllStates(AuthenticatedUser admin) {
        if (!permissionService.allowedStates(admin.userId()).containsAll(ServerStatePermissionService.ALL_STATES)) {
            throw new IllegalArgumentException("Esta operação global exige permissão para todas as UFs.");
        }
    }

    private boolean canAccessProtocol(AuthenticatedUser user, Protocol protocol, Set<String> allowedStates) {
        if (RoleAccess.isPlatformOwner(user.role())) {
            return true;
        }
        if (RoleAccess.isAdministrative(user.role())) {
            if (hasEstablishmentScope(user)) {
                return Objects.equals(user.establishmentId(), protocol.getEstablishmentId());
            }
            return permissionService.canAccess(protocol, allowedStates);
        }
        return Objects.equals(protocol.getUserId(), user.userId());
    }

    private boolean hasEstablishmentScope(AuthenticatedUser user) {
        return !RoleAccess.isPlatformOwner(user.role())
                && user.establishmentId() != null
                && !user.establishmentId().isBlank();
    }

    private ProtocolOutputDto detailsForAdmin(AuthenticatedUser user, Protocol protocol, Set<String> allowedStates) {
        return hasEstablishmentScope(user)
                ? locationGroupService.detailsForEstablishmentAdmin(protocol, user.establishmentId())
                : locationGroupService.detailsForAdmin(protocol, allowedStates);
    }
}
