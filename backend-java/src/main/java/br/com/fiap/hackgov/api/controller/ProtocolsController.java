package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.api.response.ErrorResponse;
import br.com.fiap.hackgov.application.dto.protocol.ProtocolInputDto;
import br.com.fiap.hackgov.application.usecase.protocol.CreateProtocolUseCase;
import br.com.fiap.hackgov.application.usecase.protocol.GetProtocolsUseCase;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/protocols")
public class ProtocolsController {

    private final CreateProtocolUseCase createProtocolUseCase;
    private final GetProtocolsUseCase getProtocolsUseCase;

    public ProtocolsController(
            CreateProtocolUseCase createProtocolUseCase,
            GetProtocolsUseCase getProtocolsUseCase
    ) {
        this.createProtocolUseCase = createProtocolUseCase;
        this.getProtocolsUseCase = getProtocolsUseCase;
    }

    @PostMapping
    public ResponseEntity<?> createProtocol(@RequestBody ProtocolInputDto input) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(createProtocolUseCase.execute(input));
        } catch (Exception ex) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(ex.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getProtocols(@RequestParam(required = false) String userId) {
        try {
            return ResponseEntity.ok(getProtocolsUseCase.execute(userId));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(ex.getMessage()));
        }
    }
}
