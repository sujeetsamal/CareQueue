package com.carequeue.controller;

import com.carequeue.service.PatientQueueService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Health check endpoint for container platforms (Render, Docker, Kubernetes) and monitoring.
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final PatientQueueService patientQueueService;

    public HealthController(PatientQueueService patientQueueService) {
        this.patientQueueService = patientQueueService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> checkHealth() {
        var stats = patientQueueService.getQueueStats();
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "carequeue-backend",
                "version", "1.0.0",
                "timestamp", Instant.now().toString(),
                "waitingCount", stats.waitingCount()
        ));
    }
}
