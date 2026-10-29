package com.carequeue.dsa;

import com.carequeue.entity.Patient;
import com.carequeue.entity.PatientStatus;
import com.carequeue.exception.StackEmptyException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("RecentCallsStack Unit Tests (Custom Linked LIFO Stack)")
class RecentCallsStackTest {

    private RecentCallsStack<Patient> stack;

    @BeforeEach
    void setUp() {
        stack = new RecentCallsStack<>();
    }

    private Patient createCalledPatient(String id, String token, String name) {
        return new Patient(
                id,
                token,
                name,
                25,
                "Cardiology",
                Instant.now().minusSeconds(300),
                PatientStatus.CALLED,
                Instant.now(),
                null,
                "Consultation"
        );
    }

    @Test
    @DisplayName("1. Push one entry: size is 1, peek and pop return the element")
    void testPushOneEntry() {
        Patient p1 = createCalledPatient("p1", "CQ-001", "Alice");
        stack.push(p1);

        assertFalse(stack.isEmpty());
        assertEquals(1, stack.size());
        assertEquals(p1, stack.peek());
    }

    @Test
    @DisplayName("2. Push multiple entries and verify strict LIFO order")
    void testPushMultipleAndVerifyLIFO() {
        Patient p1 = createCalledPatient("p1", "CQ-001", "Alice");
        Patient p2 = createCalledPatient("p2", "CQ-002", "Bob");
        Patient p3 = createCalledPatient("p3", "CQ-003", "Charlie");

        stack.push(p1);
        stack.push(p2);
        stack.push(p3);

        assertEquals(3, stack.size());

        // LIFO: last in (p3) must be first out
        assertEquals(p3, stack.pop());
        assertEquals(p2, stack.pop());
        assertEquals(p1, stack.pop());
        assertTrue(stack.isEmpty());
    }

    @Test
    @DisplayName("3. Peek returns the newest element without removing it")
    void testPeekDoesNotRemove() {
        Patient p1 = createCalledPatient("p1", "CQ-001", "Alice");
        stack.push(p1);

        assertEquals(p1, stack.peek());
        assertEquals(p1, stack.peek());
        assertEquals(1, stack.size());
    }

    @Test
    @DisplayName("4. Pop removes and returns the newest entry")
    void testPopNewestEntry() {
        Patient p1 = createCalledPatient("p1", "CQ-001", "Alice");
        Patient p2 = createCalledPatient("p2", "CQ-002", "Bob");

        stack.push(p1);
        stack.push(p2);

        assertEquals(p2, stack.pop());
        assertEquals(1, stack.size());
        assertEquals(p1, stack.peek());
    }

    @Test
    @DisplayName("5. Empty stack throws StackEmptyException on pop and peek")
    void testEmptyStackThrowsException() {
        assertTrue(stack.isEmpty());
        assertEquals(0, stack.size());

        assertThrows(StackEmptyException.class, () -> stack.pop());
        assertThrows(StackEmptyException.class, () -> stack.peek());
        assertTrue(stack.peekOptional().isEmpty());
    }

    @Test
    @DisplayName("6. Push/pop cycles preserve expected size count accurately")
    void testPushPopCyclesPreserveSize() {
        assertEquals(0, stack.size());

        Patient p1 = createCalledPatient("p1", "CQ-001", "Alice");
        Patient p2 = createCalledPatient("p2", "CQ-002", "Bob");

        stack.push(p1);
        assertEquals(1, stack.size());

        stack.push(p2);
        assertEquals(2, stack.size());

        stack.pop();
        assertEquals(1, stack.size());

        stack.pop();
        assertEquals(0, stack.size());
        assertTrue(stack.isEmpty());
    }

    @Test
    @DisplayName("7. toListNewestFirst returns recent calls ordered newest-to-oldest")
    void testToListNewestFirst() {
        Patient p1 = createCalledPatient("p1", "CQ-001", "Alice");
        Patient p2 = createCalledPatient("p2", "CQ-002", "Bob");
        Patient p3 = createCalledPatient("p3", "CQ-003", "Charlie");

        stack.push(p1); // called 1st
        stack.push(p2); // called 2nd
        stack.push(p3); // called 3rd (newest)

        List<Patient> list = stack.toListNewestFirst();
        assertEquals(3, list.size());
        assertEquals("p3", list.get(0).getId());
        assertEquals("p2", list.get(1).getId());
        assertEquals("p1", list.get(2).getId());

        // Ensure list is unmodifiable
        assertThrows(UnsupportedOperationException.class, () -> list.clear());
    }

    @Test
    @DisplayName("8. Repeat last call (peek) does not mutate stack or ordering")
    void testRepeatActionDoesNotMutateStack() {
        Patient p1 = createCalledPatient("p1", "CQ-001", "Alice");
        Patient p2 = createCalledPatient("p2", "CQ-002", "Bob");

        stack.push(p1);
        stack.push(p2);

        // Repeat call 3 times in succession
        assertEquals("p2", stack.peek().getId());
        assertEquals("p2", stack.peek().getId());
        assertEquals("p2", stack.peek().getId());

        assertEquals(2, stack.size());
        List<Patient> list = stack.toListNewestFirst();
        assertEquals("p2", list.get(0).getId());
        assertEquals("p1", list.get(1).getId());
    }

    @Test
    @DisplayName("9. Startup reconstruction from historical calls oldest-to-newest produces newest-at-top")
    void testStartupReconstructionOrder() {
        // Historical database calls ordered chronologically (oldest call first)
        List<Patient> historicalDbCalls = new ArrayList<>();
        historicalDbCalls.add(createCalledPatient("p1", "CQ-001", "Alice (Called 09:00)"));
        historicalDbCalls.add(createCalledPatient("p2", "CQ-002", "Bob (Called 09:15)"));
        historicalDbCalls.add(createCalledPatient("p3", "CQ-003", "Charlie (Called 09:30)"));

        // Push in chronological order (as backend startup reconstruction does)
        RecentCallsStack<Patient> reconstructedStack = new RecentCallsStack<>();
        for (Patient historical : historicalDbCalls) {
            reconstructedStack.push(historical);
        }

        // Newest call must now be at the top
        assertEquals(3, reconstructedStack.size());
        assertEquals("p3", reconstructedStack.peek().getId());
        assertEquals("CQ-003", reconstructedStack.peek().getTokenNumber());

        List<Patient> newestFirst = reconstructedStack.toListNewestFirst();
        assertEquals("p3", newestFirst.get(0).getId());
        assertEquals("p2", newestFirst.get(1).getId());
        assertEquals("p1", newestFirst.get(2).getId());
    }

    @Test
    @DisplayName("10. Reject null elements on push")
    void testRejectNullPush() {
        assertThrows(NullPointerException.class, () -> stack.push(null));
    }
}
