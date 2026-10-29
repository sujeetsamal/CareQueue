package com.carequeue.controller;

import com.carequeue.dto.RegisterPatientRequest;
import com.carequeue.repository.PatientRepository;
import com.carequeue.service.PatientQueueService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Queue & Patient REST API Integration Tests (MockMvc)")
class QueueControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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
    @DisplayName("GET /api/health returns 200 OK with status UP")
    void testHealthEndpoint() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").value("carequeue-backend"));
    }

    @Test
    @DisplayName("POST /api/patients registers patient and returns 201 Created")
    void testRegisterPatientEndpoint() throws Exception {
        RegisterPatientRequest request = new RegisterPatientRequest(
                "Elena Rostova",
                32,
                "General Medicine",
                "Routine checkup"
        );

        mockMvc.perform(post("/api/patients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.tokenNumber").isNotEmpty())
                .andExpect(jsonPath("$.name").value("Elena Rostova"))
                .andExpect(jsonPath("$.status").value("WAITING"))
                .andExpect(jsonPath("$.queuePosition").value(1));
    }

    @Test
    @DisplayName("POST /api/patients fails validation for blank name and returns 400 Bad Request")
    void testRegisterPatientValidationFailure() throws Exception {
        RegisterPatientRequest badRequest = new RegisterPatientRequest(
                "   ",
                -5,
                "",
                "A note that is excessively long".repeat(20)
        );

        mockMvc.perform(post("/api/patients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors.name").exists());
    }

    @Test
    @DisplayName("Full API queue lifecycle: Register -> Waiting list -> Call next -> Repeat -> Complete")
    void testFullApiLifecycle() throws Exception {
        // 1. Register Patient A
        RegisterPatientRequest regA = new RegisterPatientRequest("Patient Alpha", 40, "Cardiology", null);
        String resA = mockMvc.perform(post("/api/patients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regA)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String idA = objectMapper.readTree(resA).get("id").asText();

        // 2. Register Patient B
        RegisterPatientRequest regB = new RegisterPatientRequest("Patient Beta", 50, "Orthopedics", null);
        mockMvc.perform(post("/api/patients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regB)))
                .andExpect(status().isCreated());

        // 3. GET /api/queue/waiting shows 2 patients in FIFO order
        mockMvc.perform(get("/api/queue/waiting"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].name").value("Patient Alpha"))
                .andExpect(jsonPath("$[0].queuePosition").value(1))
                .andExpect(jsonPath("$[1].name").value("Patient Beta"))
                .andExpect(jsonPath("$[1].queuePosition").value(2));

        // 4. POST /api/queue/call-next calls Patient Alpha
        mockMvc.perform(post("/api/queue/call-next"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(idA))
                .andExpect(jsonPath("$.status").value("CALLED"));

        // 5. GET /api/queue/waiting now has 1 patient (Patient Beta)
        mockMvc.perform(get("/api/queue/waiting"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Patient Beta"))
                .andExpect(jsonPath("$[0].queuePosition").value(1));

        // 6. POST /api/queue/repeat-last-call returns Patient Alpha from stack peek
        mockMvc.perform(post("/api/queue/repeat-last-call"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(idA))
                .andExpect(jsonPath("$.name").value("Patient Alpha"));

        // 7. GET /api/queue/recent-calls returns Patient Alpha in stack history
        mockMvc.perform(get("/api/queue/recent-calls"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(idA));

        // 8. PATCH /api/patients/{id}/complete completes Patient Alpha
        mockMvc.perform(patch("/api/patients/" + idA + "/complete"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(idA))
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        // 9. GET /api/dashboard/stats reflects 1 waiting, 1 called, 1 completed
        mockMvc.perform(get("/api/dashboard/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.waitingCount").value(1))
                .andExpect(jsonPath("$.calledTodayCount").value(1))
                .andExpect(jsonPath("$.completedTodayCount").value(1));
    }

    @Test
    @DisplayName("POST /api/queue/call-next on empty queue returns 404 with QUEUE_EMPTY code")
    void testCallNextEmptyQueueReturns404() throws Exception {
        mockMvc.perform(post("/api/queue/call-next"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("QUEUE_EMPTY"))
                .andExpect(jsonPath("$.message").value(containsString("No patients are currently waiting")));
    }
}
