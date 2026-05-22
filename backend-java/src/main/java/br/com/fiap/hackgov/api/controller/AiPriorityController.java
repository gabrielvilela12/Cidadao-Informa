package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.domain.ai.AiJobLog;
import br.com.fiap.hackgov.domain.ai.AiPriorityJob;
import br.com.fiap.hackgov.application.service.AiPriorityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai-priority")
@RequiredArgsConstructor
public class AiPriorityController {
    private final AiPriorityService aiPriorityService;

    @PutMapping("/manual/{protocolId}")
    public ResponseEntity<Void> setManualPriority(
            @PathVariable String protocolId,
            @RequestBody ManualPriorityRequest request,
            Authentication auth) {

        UUID adminId = UUID.fromString(auth.getName());

        aiPriorityService.updatePriorityManual(
            protocolId,
            request.priority(),
            adminId,
            request.reason()
        );

        return ResponseEntity.ok().build();
    }

    @PostMapping("/regenerate/{protocolId}")
    public ResponseEntity<Void> regeneratePriority(@PathVariable String protocolId) {
        aiPriorityService.regeneratePriority(protocolId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/logs")
    public ResponseEntity<List<AiJobLog>> getAuditLogs(
            @RequestParam(defaultValue = "7") int days) {
        List<AiJobLog> logs = aiPriorityService.getAuditLogs(days);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/jobs/failed")
    public ResponseEntity<List<AiPriorityJob>> getFailedJobs() {
        List<AiPriorityJob> jobs = aiPriorityService.getFailedJobs();
        return ResponseEntity.ok(jobs);
    }

    record ManualPriorityRequest(String priority, String reason) {
    }
}
