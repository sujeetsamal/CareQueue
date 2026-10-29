package com.carequeue.service;

import com.carequeue.dto.PatientResponseDto;
import com.carequeue.dto.QueueStatsDto;
import com.carequeue.dto.RegisterPatientRequest;
import com.carequeue.entity.PatientEntity;
import com.carequeue.entity.PatientStatus;
import com.carequeue.exception.InvalidStatusTransitionException;
import com.carequeue.exception.QueueEmptyException;
import com.carequeue.exception.StackEmptyException;
import com.carequeue.repository.PatientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
@DisplayName("PatientQueueService Integration Tests (End-to-End DSA & Persistence Coordination)")
class PatientQueueServiceTest {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private PatientQueueService patientQueueService;

    @BeforeEach
    void setUp() {
        patientRepository.deleteAll();
        patientQueueService.initializeQueueState();
    }

    @Test
    @DisplayName("1. Register a patient and verify placement at the tail of the queue")
    void testRegisterPatientAppearsInQueue() {
        RegisterPatientRequest request = new RegisterPatientRequest(
                "Aarav Sharma",
                28,
                "General Medicine",
                "Fever and cough"
        );

        PatientResponseDto registered = patientQueueService.registerPatient(request);

        assertNotNull(registered.id());
        assertNotNull(registered.tokenNumber());
        assertEquals("Aarav Sharma", registered.name());
        assertEquals(PatientStatus.WAITING, registered.status());
        assertEquals(1, registered.queuePosition());

        List<PatientResponseDto> queue = patientQueueService.getWaitingQueue();
        assertEquals(1, queue.size());
        assertEquals(registered.id(), queue.get(0).id());
    }

    @Test
    @DisplayName("2-6. Multi-patient FIFO call-next, queue removal, and recent-call stack update")
    void testFifoQueueWorkflowAndStackUpdate() {
        // Register Patient 1, 2, and 3
        PatientResponseDto p1 = patientQueueService.registerPatient(
                new RegisterPatientRequest("Alice Smith", 30, "Cardiology", "Checkup")
        );
        PatientResponseDto p2 = patientQueueService.registerPatient(
                new RegisterPatientRequest("Bob Jones", 45, "Emergency", "Chest pain")
        );
        PatientResponseDto p3 = patientQueueService.registerPatient(
                new RegisterPatientRequest("Charlie Brown", 12, "Pediatrics", "Earache")
        );

        List<PatientResponseDto> queueBefore = patientQueueService.getWaitingQueue();
        assertEquals(3, queueBefore.size());
        assertEquals(p1.id(), queueBefore.get(0).id());
        assertEquals(1, queueBefore.get(0).queuePosition());
        assertEquals(p2.id(), queueBefore.get(1).id());
        assertEquals(2, queueBefore.get(1).queuePosition());
        assertEquals(p3.id(), queueBefore.get(2).id());
        assertEquals(3, queueBefore.get(2).queuePosition());

        // Call Next: must call Alice (p1)
        PatientResponseDto called1 = patientQueueService.callNextPatient();
        assertEquals(p1.id(), called1.id());
        assertEquals(PatientStatus.CALLED, called1.status());
        assertNotNull(called1.calledTime());

        // Queue must now have 2 patients: Bob is #1, Charlie is #2
        List<PatientResponseDto> queueAfter1 = patientQueueService.getWaitingQueue();
        assertEquals(2, queueAfter1.size());
        assertEquals(p2.id(), queueAfter1.get(0).id());
        assertEquals(1, queueAfter1.get(0).queuePosition());
        assertEquals(p3.id(), queueAfter1.get(1).id());
        assertEquals(2, queueAfter1.get(1).queuePosition());

        // Recent calls stack must now have Alice at the top
        List<PatientResponseDto> recentCalls = patientQueueService.getRecentCalls();
        assertEquals(1, recentCalls.size());
        assertEquals(p1.id(), recentCalls.get(0).id());

        // Call Next again: must call Bob (p2)
        PatientResponseDto called2 = patientQueueService.callNextPatient();
        assertEquals(p2.id(), called2.id());

        // Recent calls stack must show Bob first (LIFO order: newest first)
        List<PatientResponseDto> recentCallsAfter2 = patientQueueService.getRecentCalls();
        assertEquals(2, recentCallsAfter2.size());
        assertEquals(p2.id(), recentCallsAfter2.get(0).id());
        assertEquals(p1.id(), recentCallsAfter2.get(1).id());

        // Repeat last call: peeks Bob without mutating stack or queue
        PatientResponseDto repeated = patientQueueService.repeatLastCall();
        assertEquals(p2.id(), repeated.id());
        assertEquals(2, patientQueueService.getRecentCalls().size());
        assertEquals(1, patientQueueService.getWaitingQueue().size());
    }

    @Test
    @DisplayName("7. Attempting to call next when queue is empty throws QueueEmptyException")
    void testCallNextWhenEmptyThrowsException() {
        assertTrue(patientQueueService.getWaitingQueue().isEmpty());
        assertThrows(QueueEmptyException.class, () -> patientQueueService.callNextPatient());
    }

    @Test
    @DisplayName("8-9. Cancel waiting patient removes entry from queue and updates database")
    void testCancelWaitingPatient() {
        PatientResponseDto p1 = patientQueueService.registerPatient(
                new RegisterPatientRequest("Alice", 25, "General", null)
        );
        PatientResponseDto p2 = patientQueueService.registerPatient(
                new RegisterPatientRequest("Bob", 35, "General", null)
        );

        assertEquals(2, patientQueueService.getWaitingQueue().size());

        // Cancel Alice
        PatientResponseDto cancelled = patientQueueService.cancelWaitingPatient(p1.id());
        assertEquals(PatientStatus.CANCELLED, cancelled.status());

        // Queue should now only have Bob
        List<PatientResponseDto> queue = patientQueueService.getWaitingQueue();
        assertEquals(1, queue.size());
        assertEquals(p2.id(), queue.get(0).id());
        assertEquals(1, queue.get(0).queuePosition());

        // Database record should be marked CANCELLED
        PatientEntity dbRecord = patientRepository.findById(p1.id()).orElseThrow();
        assertEquals(PatientStatus.CANCELLED, dbRecord.getStatus());
    }

    @Test
    @DisplayName("10-11. Complete a called patient and reject invalid transitions")
    void testCompleteCalledPatientAndInvalidTransitions() {
        PatientResponseDto p = patientQueueService.registerPatient(
                new RegisterPatientRequest("David", 40, "Orthopedics", null)
        );

        // Cannot complete while still WAITING
        assertThrows(
                InvalidStatusTransitionException.class,
                () -> patientQueueService.completePatient(p.id())
        );

        // Call next -> CALLED
        patientQueueService.callNextPatient();

        // Cannot cancel a CALLED patient through waiting cancellation
        assertThrows(
                InvalidStatusTransitionException.class,
                () -> patientQueueService.cancelWaitingPatient(p.id())
        );

        // Complete patient -> COMPLETED
        PatientResponseDto completed = patientQueueService.completePatient(p.id());
        assertEquals(PatientStatus.COMPLETED, completed.status());
        assertNotNull(completed.completedTime());

        // Cannot complete an already COMPLETED patient
        assertThrows(
                InvalidStatusTransitionException.class,
                () -> patientQueueService.completePatient(p.id())
        );
    }

    @Test
    @DisplayName("12. Verify queue statistics accurately reflect registered, called, and completed counts")
    void testQueueStatsCalculation() {
        QueueStatsDto initialStats = patientQueueService.getQueueStats();
        assertEquals(0, initialStats.waitingCount());
        assertEquals(0, initialStats.calledTodayCount());
        assertEquals(0, initialStats.completedTodayCount());

        patientQueueService.registerPatient(new RegisterPatientRequest("P1", 20, "General", null));
        patientQueueService.registerPatient(new RegisterPatientRequest("P2", 21, "General", null));

        QueueStatsDto statsAfterRegister = patientQueueService.getQueueStats();
        assertEquals(2, statsAfterRegister.waitingCount());

        PatientResponseDto called = patientQueueService.callNextPatient();
        QueueStatsDto statsAfterCall = patientQueueService.getQueueStats();
        assertEquals(1, statsAfterCall.waitingCount());
        assertEquals(1, statsAfterCall.calledTodayCount());

        patientQueueService.completePatient(called.id());
        QueueStatsDto statsAfterComplete = patientQueueService.getQueueStats();
        assertEquals(1, statsAfterComplete.waitingCount());
        assertEquals(1, statsAfterComplete.calledTodayCount());
        assertEquals(1, statsAfterComplete.completedTodayCount());
        assertNotNull(statsAfterComplete.averageWaitTimeMinutes());
    }

    @Test
    @DisplayName("13. Startup reconstruction restores persistent queue and stack state accurately")
    void testStartupReconstruction() {
        // Register 2 patients, call 1
        PatientResponseDto p1 = patientQueueService.registerPatient(new RegisterPatientRequest("First", 20, "General", null));
        PatientResponseDto p2 = patientQueueService.registerPatient(new RegisterPatientRequest("Second", 30, "General", null));
        patientQueueService.callNextPatient(); // p1 called

        // Simulate backend restart by re-initializing from the same database
        patientQueueService.initializeQueueState();

        // Waiting queue must reconstruct with p2 in line
        List<PatientResponseDto> reconstructedQueue = patientQueueService.getWaitingQueue();
        assertEquals(1, reconstructedQueue.size());
        assertEquals(p2.id(), reconstructedQueue.get(0).id());

        // Recent calls stack must reconstruct with p1 at top
        List<PatientResponseDto> reconstructedStack = patientQueueService.getRecentCalls();
        assertEquals(1, reconstructedStack.size());
        assertEquals(p1.id(), reconstructedStack.get(0).id());
    }

    @Test
    @DisplayName("14. Repeat last call on empty stack throws StackEmptyException")
    void testRepeatCallEmptyStackThrowsException() {
        assertTrue(patientQueueService.getRecentCalls().isEmpty());
        assertThrows(StackEmptyException.class, () -> patientQueueService.repeatLastCall());
    }
}
