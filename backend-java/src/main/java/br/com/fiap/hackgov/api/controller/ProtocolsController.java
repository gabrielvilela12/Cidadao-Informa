package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.api.response.ErrorResponse;
import br.com.fiap.hackgov.application.dto.protocol.ProtocolInputDto;
import br.com.fiap.hackgov.application.dto.protocol.ProtocolOutputDto;
import br.com.fiap.hackgov.application.dto.protocol.ProtocolStatusUpdateInputDto;
import br.com.fiap.hackgov.application.dto.protocol.PublicProtocolOutputDto;
import br.com.fiap.hackgov.application.service.AiPriorityService;
import br.com.fiap.hackgov.application.service.ProtocolAuditService;
import br.com.fiap.hackgov.application.usecase.protocol.CreateProtocolUseCase;
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
    private final ProtocolRepository protocolRepository;
    private final ProtocolAuditService auditService;
    private final AiPriorityService aiPriorityService;

    public ProtocolsController(
            CreateProtocolUseCase createProtocolUseCase,
            GetProtocolsUseCase getProtocolsUseCase,
            ProtocolRepository protocolRepository,
            ProtocolAuditService auditService,
            AiPriorityService aiPriorityService
    ) {
        this.createProtocolUseCase = createProtocolUseCase;
        this.getProtocolsUseCase = getProtocolsUseCase;
        this.protocolRepository = protocolRepository;
        this.auditService = auditService;
        this.aiPriorityService = aiPriorityService;
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
                            "requester_hash", auditService.hashValue(created.requester())
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
