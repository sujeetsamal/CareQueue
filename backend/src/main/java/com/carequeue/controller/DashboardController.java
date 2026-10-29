package com.carequeue.controller;

import com.carequeue.dto.QueueStatsDto;
import com.carequeue.service.PatientQueueService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller exposing real queue analytics and metrics for the dashboard.
 */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final PatientQueueService patientQueueService;

    public DashboardController(PatientQueueService patientQueueService) {
        this.patientQueueService = patientQueueService;
    }

    @GetMapping("/stats")
    public ResponseEntity<QueueStatsDto> getDashboardStats() {
        return ResponseEntity.ok(patientQueueService.getQueueStats());
    }
}
