package com.carequeue.dsa;

import com.carequeue.entity.Patient;
import com.carequeue.entity.PatientStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("String and Validation Operations Unit Tests (Java Strings in DSA)")
class StringUtilTest {

    private Patient createPatientWithDetails(String id, String token, String name, String dept) {
        return new Patient(
                id,
                token,
                name,
                42,
                dept,
                Instant.now(),
                PatientStatus.WAITING,
                null,
                null,
                "Regular checkup"
        );
    }

    @Test
    @DisplayName("1. Strips leading and trailing whitespace while preserving internal spaces")
    void testTrimmingLeadingAndTrailingWhitespace() {
        String cleaned = StringUtil.cleanRequiredString("   Aarav   Sharma   ", 50, "Patient name");
        assertEquals("Aarav   Sharma", cleaned);
    }

    @Test
    @DisplayName("2. Rejects null, empty, or whitespace-only strings with meaningful errors")
    void testRejectNullEmptyAndWhitespaceOnly() {
        IllegalArgumentException ex1 = assertThrows(
                IllegalArgumentException.class,
                () -> StringUtil.cleanRequiredString(null, 50, "Patient name")
        );
        assertTrue(ex1.getMessage().contains("required"));

        IllegalArgumentException ex2 = assertThrows(
                IllegalArgumentException.class,
                () -> StringUtil.cleanRequiredString("", 50, "Patient name")
        );
        assertTrue(ex2.getMessage().contains("cannot be empty"));

        IllegalArgumentException ex3 = assertThrows(
                IllegalArgumentException.class,
                () -> StringUtil.cleanRequiredString("   \t  \n  ", 50, "Patient name")
        );
        assertTrue(ex3.getMessage().contains("whitespace"));
    }

    @Test
    @DisplayName("3. Enforces maximum field length constraints strictly")
    void testMaximumLengthLimit() {
        // String of length exactly 10
        String exactly10 = "1234567890";
        assertEquals(exactly10, StringUtil.cleanRequiredString(exactly10, 10, "Code"));

        // String of length 11 exceeds limit 10
        String length11 = "12345678901";
        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> StringUtil.cleanRequiredString(length11, 10, "Code")
        );
        assertTrue(ex.getMessage().contains("exceeds maximum permitted length of 10"));
    }

    @Test
    @DisplayName("4. Handles Unicode, non-English scripts, and accented characters accurately")
    void testUnicodeAndAccentedNames() {
        String spanishName = "José María Álvarez";
        String germanName = "Jürgen Müller";
        String hindiName = "आरव शर्मा";
        String japaneseName = "佐藤 健";

        assertEquals(spanishName, StringUtil.cleanRequiredString("  " + spanishName + "  ", 100, "Name"));
        assertEquals(germanName, StringUtil.cleanRequiredString(germanName, 100, "Name"));
        assertEquals(hindiName, StringUtil.cleanRequiredString(hindiName, 100, "Name"));
        assertEquals(japaneseName, StringUtil.cleanRequiredString(japaneseName, 100, "Name"));
    }

    @Test
    @DisplayName("5. Case-insensitive search using Locale.ROOT matching on name and token")
    void testCaseInsensitiveSearchWithLocaleRoot() {
        Patient patient = createPatientWithDetails("id-101", "CQ-A101", "Dr. María Hernández", "Cardiology");

        // Match lower case name substring
        assertTrue(StringUtil.matchesSearch(patient, StringUtil.normalizeSearchQuery("maría")));
        assertTrue(StringUtil.matchesSearch(patient, StringUtil.normalizeSearchQuery("MARÍA")));
        assertTrue(StringUtil.matchesSearch(patient, StringUtil.normalizeSearchQuery("hernández")));

        // Match token case-insensitively
        assertTrue(StringUtil.matchesSearch(patient, StringUtil.normalizeSearchQuery("cq-a101")));
        assertTrue(StringUtil.matchesSearch(patient, StringUtil.normalizeSearchQuery("A101")));

        // Negative search
        assertFalse(StringUtil.matchesSearch(patient, StringUtil.normalizeSearchQuery("Pediatrics")));
        assertFalse(StringUtil.matchesSearch(patient, StringUtil.normalizeSearchQuery("CQ-999")));
    }

    @Test
    @DisplayName("6. Search query with whitespace is trimmed and normalized")
    void testSearchQueryNormalization() {
        Patient patient = createPatientWithDetails("id-102", "CQ-B202", "Rajesh Kumar", "Orthopedics");

        String queryWithSpaces = "   rajesh   ";
        String normalized = StringUtil.normalizeSearchQuery(queryWithSpaces);
        assertEquals("rajesh", normalized);

        assertTrue(StringUtil.matchesSearch(patient, normalized));
    }

    @Test
    @DisplayName("7. Department filtering matches case-insensitively")
    void testDepartmentFiltering() {
        Patient p = createPatientWithDetails("id-103", "CQ-C303", "Sonia Gupta", "General Medicine");

        assertTrue(StringUtil.matchesDepartment(p, "general medicine"));
        assertTrue(StringUtil.matchesDepartment(p, "GENERAL MEDICINE"));
        assertTrue(StringUtil.matchesDepartment(p, "   General Medicine   "));
        assertTrue(StringUtil.matchesDepartment(p, null)); // empty filter matches all
        assertTrue(StringUtil.matchesDepartment(p, ""));

        assertFalse(StringUtil.matchesDepartment(p, "Cardiology"));
    }

    @Test
    @DisplayName("8. Patients with identical names are distinguished by unique IDs")
    void testSameNameDifferentIdIdentity() {
        Patient patient1 = createPatientWithDetails("uuid-1", "CQ-001", "John Smith", "Emergency");
        Patient patient2 = createPatientWithDetails("uuid-2", "CQ-002", "John Smith", "Emergency");

        assertEquals(patient1.getName(), patient2.getName());
        assertNotEquals(patient1.getId(), patient2.getId());
        assertNotEquals(patient1.getTokenNumber(), patient2.getTokenNumber());
        assertNotEquals(patient1, patient2); // Identity check
    }

    @Test
    @DisplayName("9. Optional string helper returns null for empty or whitespace strings")
    void testCleanOptionalString() {
        assertNull(StringUtil.cleanOptionalString(null, 50, "Notes"));
        assertNull(StringUtil.cleanOptionalString("", 50, "Notes"));
        assertNull(StringUtil.cleanOptionalString("    ", 50, "Notes"));

        assertEquals("Valid note", StringUtil.cleanOptionalString("  Valid note  ", 50, "Notes"));

        assertThrows(
                IllegalArgumentException.class,
                () -> StringUtil.cleanOptionalString("123456", 5, "Notes")
        );
    }
}
