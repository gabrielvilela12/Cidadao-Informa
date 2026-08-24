package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.application.service.DailyOperationalReportService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;

@RestController
@RequestMapping("/api/cron/daily-reports")
public class DailyReportCronController {
    private final DailyOperationalReportService service;
    private final String cronSecret;

    public DailyReportCronController(DailyOperationalReportService service,
                                     @Value("${app.cron.secret:}") String cronSecret) {
        this.service = service;
        this.cronSecret = cronSecret;
    }

    @GetMapping
    public ResponseEntity<?> generate(@RequestHeader(value = "Authorization", required = false) String authorization) {
        if (cronSecret == null || cronSecret.isBlank()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "Rotina diária não configurada."));
        }
        String expected = "Bearer " + cronSecret;
        if (authorization == null || !MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8),
                authorization.getBytes(StandardCharsets.UTF_8))) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Credencial da rotina inválida."));
        }
        return ResponseEntity.ok(service.generateYesterday());
    }
}
