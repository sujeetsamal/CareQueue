package com.carequeue.dsa;

import com.carequeue.entity.Patient;
import com.carequeue.entity.PatientStatus;
import com.carequeue.exception.QueueEmptyException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("LinkedPatientQueue Unit Tests (Custom Singly-Linked List FIFO Queue)")
class LinkedPatientQueueTest {

    private LinkedPatientQueue queue;

    @BeforeEach
    void setUp() {
        queue = new LinkedPatientQueue();
    }

    private Patient createTestPatient(String id, String token, String name) {
        return new Patient(
                id,
                token,
                name,
                30,
                "General Medicine",
                Instant.now(),
                PatientStatus.WAITING,
                null,
                null,
                "Routine checkup"
        );
    }

    @Test
    @DisplayName("1. Enqueue one patient: head and tail point to patient, size is 1")
    void testEnqueueOnePatient() {
        Patient p1 = createTestPatient("p1", "CQ-001", "Alice");
        queue.enqueue(p1);

        assertFalse(queue.isEmpty());
        assertEquals(1, queue.size());
        assertEquals(p1, queue.peek());
    }

    @Test
    @DisplayName("2. Enqueue multiple patients and verify strict FIFO order")
    void testEnqueueMultipleAndVerifyFIFO() {
        Patient p1 = createTestPatient("p1", "CQ-001", "Alice");
        Patient p2 = createTestPatient("p2", "CQ-002", "Bob");
        Patient p3 = createTestPatient("p3", "CQ-003", "Charlie");

        queue.enqueue(p1);
        queue.enqueue(p2);
        queue.enqueue(p3);

        assertEquals(3, queue.size());

        List<Patient> snapshot = queue.snapshot();
        assertEquals(3, snapshot.size());
        assertEquals("p1", snapshot.get(0).getId());
        assertEquals("p2", snapshot.get(1).getId());
        assertEquals("p3", snapshot.get(2).getId());

        assertEquals(p1, queue.dequeue());
        assertEquals(p2, queue.dequeue());
        assertEquals(p3, queue.dequeue());
        assertTrue(queue.isEmpty());
    }

    @Test
    @DisplayName("3. Dequeue advances head and decrements size")
    void testDequeueAdvancesHead() {
        Patient p1 = createTestPatient("p1", "CQ-001", "Alice");
        Patient p2 = createTestPatient("p2", "CQ-002", "Bob");

        queue.enqueue(p1);
        queue.enqueue(p2);

        assertEquals(p1, queue.dequeue());
        assertEquals(1, queue.size());
        assertEquals(p2, queue.peek());
    }

    @Test
    @DisplayName("4. Peek returns head without removing the patient")
    void testPeekWithoutRemoving() {
        Patient p1 = createTestPatient("p1", "CQ-001", "Alice");
        queue.enqueue(p1);

        assertEquals(p1, queue.peek());
        assertEquals(p1, queue.peek());
        assertEquals(1, queue.size());
        assertFalse(queue.isEmpty());
    }

    @Test
    @DisplayName("5. Empty queue operations handle safely with QueueEmptyException")
    void testEmptyQueueThrowsException() {
        assertTrue(queue.isEmpty());
        assertEquals(0, queue.size());

        assertThrows(QueueEmptyException.class, () -> queue.dequeue());
        assertThrows(QueueEmptyException.class, () -> queue.peek());
        assertTrue(queue.peekOptional().isEmpty());
    }

    @Test
    @DisplayName("6. Size matches exact node count after every operation")
    void testSizeConsistency() {
        assertEquals(0, queue.size());

        Patient p1 = createTestPatient("p1", "CQ-001", "Alice");
        Patient p2 = createTestPatient("p2", "CQ-002", "Bob");

        queue.enqueue(p1);
        assertEquals(1, queue.size());

        queue.enqueue(p2);
        assertEquals(2, queue.size());

        queue.dequeue();
        assertEquals(1, queue.size());

        queue.dequeue();
        assertEquals(0, queue.size());
        assertTrue(queue.isEmpty());
    }

    @Test
    @DisplayName("7. Remove head node: preserves remaining queue and updates head")
    void testRemoveHead() {
        Patient p1 = createTestPatient("p1", "CQ-001", "Alice");
        Patient p2 = createTestPatient("p2", "CQ-002", "Bob");
        Patient p3 = createTestPatient("p3", "CQ-003", "Charlie");

        queue.enqueue(p1);
        queue.enqueue(p2);
        queue.enqueue(p3);

        Optional<Patient> removed = queue.removeById("p1");
        assertTrue(removed.isPresent());
        assertEquals(p1, removed.get());
        assertEquals(2, queue.size());

        assertEquals(p2, queue.peek());
        assertEquals(p2, queue.dequeue());
        assertEquals(p3, queue.dequeue());
        assertTrue(queue.isEmpty());
    }

    @Test
    @DisplayName("8. Remove tail node: preserves head and middle, updates tail pointer")
    void testRemoveTail() {
        Patient p1 = createTestPatient("p1", "CQ-001", "Alice");
        Patient p2 = createTestPatient("p2", "CQ-002", "Bob");
        Patient p3 = createTestPatient("p3", "CQ-003", "Charlie");

        queue.enqueue(p1);
        queue.enqueue(p2);
        queue.enqueue(p3);

        Optional<Patient> removed = queue.removeById("p3");
        assertTrue(removed.isPresent());
        assertEquals(p3, removed.get());
        assertEquals(2, queue.size());

        // Enqueue a new patient to verify tail pointer was updated correctly
        Patient p4 = createTestPatient("p4", "CQ-004", "David");
        queue.enqueue(p4);
        assertEquals(3, queue.size());

        assertEquals(p1, queue.dequeue());
        assertEquals(p2, queue.dequeue());
        assertEquals(p4, queue.dequeue());
        assertTrue(queue.isEmpty());
    }

    @Test
    @DisplayName("9. Remove entry from middle: maintains links and size")
    void testRemoveMiddle() {
        Patient p1 = createTestPatient("p1", "CQ-001", "Alice");
        Patient p2 = createTestPatient("p2", "CQ-002", "Bob");
        Patient p3 = createTestPatient("p3", "CQ-003", "Charlie");

        queue.enqueue(p1);
        queue.enqueue(p2);
        queue.enqueue(p3);

        Optional<Patient> removed = queue.removeById("p2");
        assertTrue(removed.isPresent());
        assertEquals(p2, removed.get());
        assertEquals(2, queue.size());

        assertEquals(p1, queue.dequeue());
        assertEquals(p3, queue.dequeue());
        assertTrue(queue.isEmpty());
    }

    @Test
    @DisplayName("10. Remove the only patient: resets both head and tail to null")
    void testRemoveOnlyPatientResetsHeadAndTail() {
        Patient p1 = createTestPatient("p1", "CQ-001", "Alice");
        queue.enqueue(p1);

        Optional<Patient> removed = queue.removeById("p1");
        assertTrue(removed.isPresent());
        assertEquals(p1, removed.get());
        assertEquals(0, queue.size());
        assertTrue(queue.isEmpty());

        // Subsequent enqueue should work seamlessly
        Patient p2 = createTestPatient("p2", "CQ-002", "Bob");
        queue.enqueue(p2);
        assertEquals(1, queue.size());
        assertEquals(p2, queue.peek());
    }

    @Test
    @DisplayName("11. Search for existing and missing IDs with findById")
    void testFindById() {
        Patient p1 = createTestPatient("p1", "CQ-001", "Alice");
        Patient p2 = createTestPatient("p2", "CQ-002", "Bob");

        queue.enqueue(p1);
        queue.enqueue(p2);

        Optional<Patient> found1 = queue.findById("p1");
        assertTrue(found1.isPresent());
        assertEquals("Alice", found1.get().getName());

        Optional<Patient> found2 = queue.findById("p2");
        assertTrue(found2.isPresent());
        assertEquals("Bob", found2.get().getName());

        Optional<Patient> missing = queue.findById("non-existent");
        assertTrue(missing.isEmpty());

        Optional<Patient> nullQuery = queue.findById(null);
        assertTrue(nullQuery.isEmpty());
    }

    @Test
    @DisplayName("12. Queue remains valid after multiple cancellations")
    void testQueueIntegrityAfterMultipleCancellations() {
        Patient p1 = createTestPatient("p1", "CQ-001", "Alice");
        Patient p2 = createTestPatient("p2", "CQ-002", "Bob");
        Patient p3 = createTestPatient("p3", "CQ-003", "Charlie");
        Patient p4 = createTestPatient("p4", "CQ-004", "Diana");

        queue.enqueue(p1);
        queue.enqueue(p2);
        queue.enqueue(p3);
        queue.enqueue(p4);

        // Cancel middle (Bob) and tail (Diana)
        assertTrue(queue.removeById("p2").isPresent());
        assertTrue(queue.removeById("p4").isPresent());
        assertEquals(2, queue.size());

        // Enqueue new patient (Eva)
        Patient p5 = createTestPatient("p5", "CQ-005", "Eva");
        queue.enqueue(p5);
        assertEquals(3, queue.size());

        assertEquals("p1", queue.dequeue().getId());
        assertEquals("p3", queue.dequeue().getId());
        assertEquals("p5", queue.dequeue().getId());
        assertTrue(queue.isEmpty());
    }

    @Test
    @DisplayName("13. Size never becomes negative or inconsistent")
    void testSizeNeverNegative() {
        assertEquals(0, queue.size());
        assertTrue(queue.removeById("does-not-exist").isEmpty());
        assertEquals(0, queue.size());

        assertThrows(QueueEmptyException.class, () -> queue.dequeue());
        assertEquals(0, queue.size());
    }

    @Test
    @DisplayName("14. Reject null patient on enqueue")
    void testRejectNullEnqueue() {
        assertThrows(NullPointerException.class, () -> queue.enqueue(null));
    }

    @Test
    @DisplayName("15. Snapshot does not allow mutating internal state")
    void testSnapshotIsUnmodifiable() {
        Patient p1 = createTestPatient("p1", "CQ-001", "Alice");
        queue.enqueue(p1);

        List<Patient> snapshot = queue.snapshot();
        assertEquals(1, snapshot.size());
        assertThrows(UnsupportedOperationException.class, () -> snapshot.add(createTestPatient("p2", "CQ-002", "Bob")));
    }
}
