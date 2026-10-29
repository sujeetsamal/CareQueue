package com.carequeue.controller;

import com.carequeue.dto.PatientResponseDto;
import com.carequeue.dto.RegisterPatientRequest;
import com.carequeue.entity.PatientStatus;
import com.carequeue.service.PatientQueueService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller handling patient lifecycle operations:
 * registration, searching, individual record inspection, completion, and cancellation.
 */
@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientQueueService patientQueueService;

    public PatientController(PatientQueueService patientQueueService) {
        this.patientQueueService = patientQueueService;
    }

    /**
     * Registers a new patient into the hospital queue.
     * Generates a unique queue token and enqueues into LinkedPatientQueue.
     */
    @PostMapping
    public ResponseEntity<PatientResponseDto> registerPatient(@Valid @RequestBody RegisterPatientRequest request) {
        PatientResponseDto registered = patientQueueService.registerPatient(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(registered);
    }

    /**
     * Searches and filters all patient records.
     */
    @GetMapping
    public ResponseEntity<List<PatientResponseDto>> searchPatients(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) PatientStatus status) {
        return ResponseEntity.ok(patientQueueService.searchAndFilterPatients(search, department, status));
    }

    /**
     * Retrieves an individual patient record by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<PatientResponseDto> getPatientById(@PathVariable String id) {
        return ResponseEntity.ok(patientQueueService.getPatientById(id));
    }

    /**
     * Cancels a WAITING patient's entry after confirmation.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<PatientResponseDto> cancelWaitingEntry(@PathVariable String id) {
        return ResponseEntity.ok(patientQueueService.cancelWaitingPatient(id));
    }

    /**
     * Marks a CALLED patient as COMPLETED.
     */
    @PatchMapping("/{id}/complete")
    public ResponseEntity<PatientResponseDto> completePatient(@PathVariable String id) {
        return ResponseEntity.ok(patientQueueService.completePatient(id));
    }
}
