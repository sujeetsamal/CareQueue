package com.carequeue.controller;

import com.carequeue.dto.PagedResponse;
import com.carequeue.dto.PatientResponseDto;
import com.carequeue.dto.RegisterPatientRequest;
import com.carequeue.dto.SimilarPatientDto;
import com.carequeue.entity.PatientStatus;
import com.carequeue.service.PatientQueueService;
import com.carequeue.service.PatientSimilarityService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Controller handling patient lifecycle operations:
 * registration, similarity detection, searching, pagination, completion, and cancellation.
 */
@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientQueueService patientQueueService;
    private final PatientSimilarityService patientSimilarityService;

    public PatientController(
            PatientQueueService patientQueueService,
            PatientSimilarityService patientSimilarityService
    ) {
        this.patientQueueService = patientQueueService;
        this.patientSimilarityService = patientSimilarityService;
    }

    /**
     * Registers a new patient into the hospital queue.
     * Generates an atomic daily department token (PREFIX-NNN) and enqueues into LinkedPatientQueue.
     */
    @PostMapping
    public ResponseEntity<PatientResponseDto> registerPatient(@Valid @RequestBody RegisterPatientRequest request) {
        PatientResponseDto registered = patientQueueService.registerPatient(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(registered);
    }

    /**
     * Checks for similar existing patient records before registration submission.
     * Starts matching when >= 2 characters are entered, bounded to top 5 matches.
     */
    @GetMapping("/similar")
    public ResponseEntity<List<SimilarPatientDto>> getSimilarPatients(
            @RequestParam String name,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) Integer age
    ) {
        List<SimilarPatientDto> matches = patientSimilarityService.findSimilarPatients(name, department, age);
        return ResponseEntity.ok(matches);
    }

    /**
     * Server-side paginated patient registry search, filter, and sort endpoint.
     */
    @GetMapping("/paged")
    public ResponseEntity<PagedResponse<PatientResponseDto>> getPatientsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) PatientStatus status,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        PagedResponse<PatientResponseDto> paged = patientQueueService.getPatientsPaged(
                page, size, search, department, status, sortBy, startDate, endDate
        );
        return ResponseEntity.ok(paged);
    }

    /**
     * Searches and filters all patient records (legacy unpaginated endpoint).
     */
    @GetMapping
    public ResponseEntity<List<PatientResponseDto>> searchPatients(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) PatientStatus status
    ) {
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
