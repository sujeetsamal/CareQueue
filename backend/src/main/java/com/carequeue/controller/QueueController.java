package com.carequeue.controller;

import com.carequeue.dto.PatientResponseDto;
import com.carequeue.service.PatientQueueService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller exposing core DSA queue and stack operations:
 * FIFO waiting list snapshot, calling next patient, recent calls stack list, and repeat last call.
 */
@RestController
@RequestMapping("/api/queue")
public class QueueController {

    private final PatientQueueService patientQueueService;

    public QueueController(PatientQueueService patientQueueService) {
        this.patientQueueService = patientQueueService;
    }

    /**
     * Retrieves the waiting patients snapshot in strict FIFO order from LinkedPatientQueue.
     */
    @GetMapping("/waiting")
    public ResponseEntity<List<PatientResponseDto>> getWaitingQueue() {
        return ResponseEntity.ok(patientQueueService.getWaitingQueue());
    }

    /**
     * Calls the next patient in line.
     * Dequeues from head of LinkedPatientQueue and pushes onto RecentCallsStack.
     */
    @PostMapping("/call-next")
    public ResponseEntity<PatientResponseDto> callNextPatient() {
        return ResponseEntity.ok(patientQueueService.callNextPatient());
    }

    /**
     * Retrieves the list of recently called patients from RecentCallsStack (LIFO: newest first).
     */
    @GetMapping("/recent-calls")
    public ResponseEntity<List<PatientResponseDto>> getRecentCalls() {
        return ResponseEntity.ok(patientQueueService.getRecentCalls());
    }

    /**
     * Returns the latest called patient at the top of the stack (RecentCallsStack.peek())
     * for announcement repetition without altering queue or stack state.
     */
    @PostMapping("/repeat-last-call")
    public ResponseEntity<PatientResponseDto> repeatLastCall() {
        return ResponseEntity.ok(patientQueueService.repeatLastCall());
    }
}
