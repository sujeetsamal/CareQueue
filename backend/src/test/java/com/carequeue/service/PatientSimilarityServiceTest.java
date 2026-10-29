package com.carequeue.service;

import com.carequeue.dto.SimilarPatientDto;
import com.carequeue.entity.PatientEntity;
import com.carequeue.entity.PatientStatus;
import com.carequeue.repository.PatientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
@DisplayName("PatientSimilarityService Tests (Levenshtein Fuzzy Matching, Whitespace & Boundary Rules)")
class PatientSimilarityServiceTest {

    @Autowired
    private PatientSimilarityService similarityService;

    @Autowired
    private PatientRepository patientRepository;

    @BeforeEach
    void setUp() {
        patientRepository.deleteAll();
    }

    private PatientEntity createPatient(String name, String token, String department, Integer age, PatientStatus status) {
        PatientEntity entity = new PatientEntity(
                UUID.randomUUID().toString(),
                token,
                name,
                age,
                department,
                Instant.now(),
                status,
                null,
                null,
                "Test notes",
                LocalDate.now(),
                "GEN",
                1
        );
        return patientRepository.save(entity);
    }

    @Test
    @DisplayName("1. String normalization collapses internal whitespace and lowercases")
    void testNormalization() {
        assertEquals("maya lin", similarityService.normalizeForComparison("  Maya   Lin  "));
        assertEquals("carlos mendez", similarityService.normalizeForComparison("CARLOS  MENDEZ"));
        assertEquals("", similarityService.normalizeForComparison(null));
        assertEquals("", similarityService.normalizeForComparison("   "));
    }

    @Test
    @DisplayName("2. Exact match returns similarity 1.0")
    void testExactMatch() {
        createPatient("Maya Lin", "GEN-001", "General Medicine", 30, PatientStatus.WAITING);

        List<SimilarPatientDto> matches = similarityService.findSimilarPatients("Maya Lin", "General Medicine", 30);
        assertFalse(matches.isEmpty());
        assertEquals("Maya Lin", matches.get(0).name());
        assertEquals(1.0, matches.get(0).similarityScore(), 0.01);
        assertTrue(matches.get(0).isWaiting());
    }

    @Test
    @DisplayName("3. Case-insensitive and whitespace-insensitive matching")
    void testWhitespaceAndCaseInsensitiveMatch() {
        createPatient("Maya Lin", "GEN-001", "General Medicine", 30, PatientStatus.COMPLETED);

        // Multiple spaces and uppercase
        List<SimilarPatientDto> matches = similarityService.findSimilarPatients("  MAYA    LIN  ", null, null);
        assertFalse(matches.isEmpty());
        assertEquals("Maya Lin", matches.get(0).name());
        assertEquals(1.0, matches.get(0).similarityScore(), 0.01);
        assertFalse(matches.get(0).isWaiting()); // Completed, not waiting
    }

    @Test
    @DisplayName("4. Substring matching identifies partial patient names")
    void testSubstringMatch() {
        createPatient("Alexander Hamilton", "GEN-002", "General Medicine", 40, PatientStatus.WAITING);

        List<SimilarPatientDto> matches = similarityService.findSimilarPatients("Hamilton", null, null);
        assertFalse(matches.isEmpty());
        assertEquals("Alexander Hamilton", matches.get(0).name());
        assertTrue(matches.get(0).similarityScore() >= 0.80);
    }

    @Test
    @DisplayName("5. Levenshtein fuzzy matching catches minor spelling typos")
    void testFuzzyLevenshteinTypoMatching() {
        createPatient("Christopher Nolan", "GEN-003", "Cardiology", 50, PatientStatus.WAITING);

        // Typo: Cristopher Nolan (missing 'h')
        List<SimilarPatientDto> matches = similarityService.findSimilarPatients("Cristopher Nolan", null, null);
        assertFalse(matches.isEmpty(), "Fuzzy match should find Christopher Nolan");
        assertEquals("Christopher Nolan", matches.get(0).name());
        assertTrue(matches.get(0).similarityScore() >= 0.75);
    }

    @Test
    @DisplayName("6. Queries shorter than 2 characters return empty list immediately")
    void testShortQueriesReturnEmpty() {
        createPatient("John Doe", "GEN-004", "General Medicine", 25, PatientStatus.WAITING);

        assertTrue(similarityService.findSimilarPatients("", null, null).isEmpty());
        assertTrue(similarityService.findSimilarPatients(" ", null, null).isEmpty());
        assertTrue(similarityService.findSimilarPatients("J", null, null).isEmpty());
        assertTrue(similarityService.findSimilarPatients(null, null, null).isEmpty());
    }

    @Test
    @DisplayName("7. Results are bounded to maximum 5 records")
    void testBoundedResultsMaxFive() {
        // Create 8 patients with similar names
        for (int i = 1; i <= 8; i++) {
            createPatient("David Miller " + i, "GEN-00" + i, "General Medicine", 30 + i, PatientStatus.WAITING);
        }

        List<SimilarPatientDto> matches = similarityService.findSimilarPatients("David Miller", null, null);
        assertTrue(matches.size() <= 5, "Results must never exceed 5 items");
    }
}
