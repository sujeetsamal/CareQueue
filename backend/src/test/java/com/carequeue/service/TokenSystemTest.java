package com.carequeue.service;

import com.carequeue.repository.DepartmentDailyTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@DisplayName("Department Daily Token System Tests (Prefix, Daily Rollover, Concurrency & Timezone)")
class TokenSystemTest {

    @Autowired
    private DepartmentTokenService departmentTokenService;

    @Autowired
    private DepartmentDailyTokenRepository tokenRepository;

    @BeforeEach
    void setUp() {
        tokenRepository.deleteAll();
    }

    @Test
    @DisplayName("1. First token per department is PREFIX-001 and second is PREFIX-002")
    void testDepartmentSequencesIncrementIndependently() {
        LocalDate today = LocalDate.now(DepartmentTokenService.QUEUE_TIMEZONE);

        // General Medicine: 001, 002
        DepartmentTokenService.TokenAllocation gen1 = departmentTokenService.allocateNextTokenForDate("General Medicine", today);
        assertEquals("GEN-001", gen1.tokenNumber());
        assertEquals("GEN", gen1.departmentCode());
        assertEquals(1, gen1.sequenceNumber());

        DepartmentTokenService.TokenAllocation gen2 = departmentTokenService.allocateNextTokenForDate("General Medicine", today);
        assertEquals("GEN-002", gen2.tokenNumber());
        assertEquals(2, gen2.sequenceNumber());

        // Dermatology: starts at DER-001
        DepartmentTokenService.TokenAllocation der1 = departmentTokenService.allocateNextTokenForDate("Dermatology", today);
        assertEquals("DER-001", der1.tokenNumber());
        assertEquals("DER", der1.departmentCode());
        assertEquals(1, der1.sequenceNumber());

        // Pediatrics: starts at PED-001
        DepartmentTokenService.TokenAllocation ped1 = departmentTokenService.allocateNextTokenForDate("Pediatrics", today);
        assertEquals("PED-001", ped1.tokenNumber());
        assertEquals("PED", ped1.departmentCode());
        assertEquals(1, ped1.sequenceNumber());

        // Orthopedics: starts at ORT-001
        DepartmentTokenService.TokenAllocation ort1 = departmentTokenService.allocateNextTokenForDate("Orthopedics", today);
        assertEquals("ORT-001", ort1.tokenNumber());
        assertEquals("ORT", ort1.departmentCode());
        assertEquals(1, ort1.sequenceNumber());

        // Cardiology: starts at CRD-001
        DepartmentTokenService.TokenAllocation crd1 = departmentTokenService.allocateNextTokenForDate("Cardiology", today);
        assertEquals("CRD-001", crd1.tokenNumber());
        assertEquals("CRD", crd1.departmentCode());
        assertEquals(1, crd1.sequenceNumber());

        // Dermatology #2: DER-002
        DepartmentTokenService.TokenAllocation der2 = departmentTokenService.allocateNextTokenForDate("Dermatology", today);
        assertEquals("DER-002", der2.tokenNumber());
        assertEquals(2, der2.sequenceNumber());
    }

    @Test
    @DisplayName("2. Counter resets to 001 on a new local calendar day")
    void testDailyRolloverStartsFreshSequence() {
        LocalDate day1 = LocalDate.of(2026, 10, 29);
        LocalDate day2 = LocalDate.of(2026, 10, 30);

        DepartmentTokenService.TokenAllocation t1 = departmentTokenService.allocateNextTokenForDate("Cardiology", day1);
        assertEquals("CRD-001", t1.tokenNumber());

        DepartmentTokenService.TokenAllocation t2 = departmentTokenService.allocateNextTokenForDate("Cardiology", day1);
        assertEquals("CRD-002", t2.tokenNumber());

        // On next day, starts back at 001
        DepartmentTokenService.TokenAllocation nextDayToken = departmentTokenService.allocateNextTokenForDate("Cardiology", day2);
        assertEquals("CRD-001", nextDayToken.tokenNumber());
        assertEquals(day2, nextDayToken.queueDate());
        assertEquals(1, nextDayToken.sequenceNumber());
    }

    @Test
    @DisplayName("3. Multi-threaded concurrent registrations never produce duplicate tokens")
    void testConcurrentRegistrationsProduceUniqueTokens() throws InterruptedException, ExecutionException {
        int threadCount = 20;
        ExecutorService executor = Executors.newFixedThreadPool(8);
        List<Callable<String>> tasks = new ArrayList<>();
        LocalDate today = LocalDate.now(DepartmentTokenService.QUEUE_TIMEZONE);

        for (int i = 0; i < threadCount; i++) {
            tasks.add(() -> {
                DepartmentTokenService.TokenAllocation alloc =
                        departmentTokenService.allocateNextTokenForDate("General Medicine", today);
                return alloc.tokenNumber();
            });
        }

        List<Future<String>> futures = executor.invokeAll(tasks);
        Set<String> generatedTokens = Collections.synchronizedSet(new HashSet<>());

        for (Future<String> future : futures) {
            String token = future.get();
            assertNotNull(token);
            assertTrue(generatedTokens.add(token), "Duplicate token detected: " + token);
        }

        executor.shutdown();
        assertEquals(threadCount, generatedTokens.size());
    }

    @Test
    @DisplayName("4. Canonical department mapping handles casing and unknown departments gracefully")
    void testDepartmentCodeResolution() {
        assertEquals("GEN", departmentTokenService.resolveDepartmentCode("General Medicine"));
        assertEquals("GEN", departmentTokenService.resolveDepartmentCode("general medicine"));
        assertEquals("CRD", departmentTokenService.resolveDepartmentCode("Cardiology"));
        assertEquals("PED", departmentTokenService.resolveDepartmentCode("Pediatrics"));
        assertEquals("ORT", departmentTokenService.resolveDepartmentCode("Orthopedics"));
        assertEquals("DER", departmentTokenService.resolveDepartmentCode("Dermatology"));
        assertEquals("EMG", departmentTokenService.resolveDepartmentCode("Emergency Care"));
        assertEquals("GEN", departmentTokenService.resolveDepartmentCode(null));
        assertEquals("GEN", departmentTokenService.resolveDepartmentCode(""));
    }
}
