package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.application.dto.protocol.TransparencyOutputDto;
import br.com.fiap.hackgov.application.usecase.protocol.GetTransparencyUseCase;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
@RequestMapping("/api/transparency")
public class TransparencyController {

    private final GetTransparencyUseCase getTransparencyUseCase;

    public TransparencyController(GetTransparencyUseCase getTransparencyUseCase) {
        this.getTransparencyUseCase = getTransparencyUseCase;
    }

    @GetMapping
    public ResponseEntity<TransparencyOutputDto> getTransparency() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofSeconds(30)).cachePublic())
                .header("Vary", "Origin")
                .body(getTransparencyUseCase.execute());
    }
}
