package com.carequeue.service;

import com.carequeue.dto.PagedResponse;
import com.carequeue.dto.PatientResponseDto;
import com.carequeue.dto.RegisterPatientRequest;
import com.carequeue.entity.PatientStatus;
import com.carequeue.repository.PatientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
@DisplayName("Patient Registry Pagination, Filtering & Sorting Tests")
class PatientRegistryPaginationTest {

    @Autowired
    private PatientQueueService patientQueueService;

    @Autowired
    private PatientRepository patientRepository;

    @BeforeEach
    void setUp() {
        patientRepository.deleteAll();
        patientQueueService.initializeQueueState();
    }

    @Test
    @DisplayName("1. Server-side pagination returns correct page slices and metadata")
    void testServerSidePagination() {
        // Register 15 patients
        for (int i = 1; i <= 15; i++) {
            patientQueueService.registerPatient(new RegisterPatientRequest(
                    "Patient " + i, 20 + i, "General Medicine", null
            ));
        }

        // Page 0, Size 10
        PagedResponse<PatientResponseDto> page0 = patientQueueService.getPatientsPaged(
                0, 10, null, null, null, "newest", null, null
        );
        assertEquals(10, page0.content().size());
        assertEquals(0, page0.pageNumber());
        assertEquals(10, page0.pageSize());
        assertEquals(15, page0.totalElements());
        assertEquals(2, page0.totalPages());
        assertTrue(page0.isFirst());
        assertFalse(page0.isLast());

        // Page 1, Size 10
        PagedResponse<PatientResponseDto> page1 = patientQueueService.getPatientsPaged(
                1, 10, null, null, null, "newest", null, null
        );
        assertEquals(5, page1.content().size());
        assertEquals(1, page1.pageNumber());
        assertFalse(page1.isFirst());
        assertTrue(page1.isLast());
    }

    @Test
    @DisplayName("2. Multi-field search filters by name and token across entire database")
    void testSearchByNameAndToken() {
        PatientResponseDto p1 = patientQueueService.registerPatient(new RegisterPatientRequest("Ananya Rao", 26, "Dermatology", null));
        PatientResponseDto p2 = patientQueueService.registerPatient(new RegisterPatientRequest("Rohan Verma", 34, "Cardiology", null));

        PagedResponse<PatientResponseDto> searchName = patientQueueService.getPatientsPaged(
                0, 10, "Ananya", null, null, "newest", null, null
        );
        assertEquals(1, searchName.totalElements());
        assertEquals(p1.id(), searchName.content().get(0).id());

        // Search by token
        PagedResponse<PatientResponseDto> searchToken = patientQueueService.getPatientsPaged(
                0, 10, p2.tokenNumber(), null, null, "newest", null, null
        );
        assertEquals(1, searchToken.totalElements());
        assertEquals(p2.id(), searchToken.content().get(0).id());
    }

    @Test
    @DisplayName("3. Filtering by department and status")
    void testFilterByDepartmentAndStatus() {
        PatientResponseDto p1 = patientQueueService.registerPatient(new RegisterPatientRequest("Child A", 5, "Pediatrics", null));
        PatientResponseDto p2 = patientQueueService.registerPatient(new RegisterPatientRequest("Adult B", 45, "General Medicine", null));

        // Call p1 so it becomes CALLED
        patientQueueService.callNextPatient();

        // Filter status WAITING
        PagedResponse<PatientResponseDto> waitingPatients = patientQueueService.getPatientsPaged(
                0, 10, null, null, PatientStatus.WAITING, "newest", null, null
        );
        assertEquals(1, waitingPatients.totalElements());
        assertEquals(p2.id(), waitingPatients.content().get(0).id());

        // Filter department Pediatrics
        PagedResponse<PatientResponseDto> pedPatients = patientQueueService.getPatientsPaged(
                0, 10, null, "Pediatrics", null, "newest", null, null
        );
        assertEquals(1, pedPatients.totalElements());
        assertEquals(p1.id(), pedPatients.content().get(0).id());
    }

    @Test
    @DisplayName("4. Sorting registry does NOT alter FIFO order of the waiting queue")
    void testSortingRegistryPreservesFifoQueueOrder() {
        // Register in order: Charlie, Alice, Bob
        PatientResponseDto pCharlie = patientQueueService.registerPatient(new RegisterPatientRequest("Charlie", 40, "General Medicine", null));
        PatientResponseDto pAlice = patientQueueService.registerPatient(new RegisterPatientRequest("Alice", 25, "General Medicine", null));
        PatientResponseDto pBob = patientQueueService.registerPatient(new RegisterPatientRequest("Bob", 30, "General Medicine", null));

        // Verify waiting queue is strictly Charlie -> Alice -> Bob (FIFO)
        List<PatientResponseDto> queue = patientQueueService.getWaitingQueue();
        assertEquals(pCharlie.id(), queue.get(0).id());
        assertEquals(pAlice.id(), queue.get(1).id());
        assertEquals(pBob.id(), queue.get(2).id());

        // Sort registry by name ASC (Alice -> Bob -> Charlie)
        PagedResponse<PatientResponseDto> sortedRegistry = patientQueueService.getPatientsPaged(
                0, 10, null, null, null, "name_asc", null, null
        );
        assertEquals("Alice", sortedRegistry.content().get(0).name());
        assertEquals("Bob", sortedRegistry.content().get(1).name());
        assertEquals("Charlie", sortedRegistry.content().get(2).name());

        // CRITICAL CHECK: In-memory waiting queue MUST REMAIN Charlie -> Alice -> Bob!
        List<PatientResponseDto> queueAfterSort = patientQueueService.getWaitingQueue();
        assertEquals(pCharlie.id(), queueAfterSort.get(0).id(), "Queue head must still be Charlie");
        assertEquals(pAlice.id(), queueAfterSort.get(1).id());
        assertEquals(pBob.id(), queueAfterSort.get(2).id());

        // Calling next patient still dequeues Charlie
        PatientResponseDto called = patientQueueService.callNextPatient();
        assertEquals(pCharlie.id(), called.id());
    }
}
