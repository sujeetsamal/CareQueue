package com.carequeue.dsa;

import com.carequeue.entity.Patient;

import java.util.Locale;

/**
 * Utility class demonstrating real-world String operations for DSA coursework:
 * - Trimming leading/trailing whitespace without corrupting internal spaces
 * - Rejecting null, empty, or whitespace-only strings
 * - Strict length constraints with human-readable validation errors
 * - Unicode preservation for non-English letters and accented names (e.g. "José Müller", "Aarav Sharma")
 * - Case-insensitive searching and normalization using Locale.ROOT to avoid locale-specific anomalies
 */
public final class StringUtil {

    private StringUtil() {
        // Utility class
    }

    /**
     * Cleans and validates a required string field.
     * Trims leading/trailing whitespace, rejects null or whitespace-only values,
     * and ensures length does not exceed maxLength.
     * Preserves original casing and Unicode characters.
     *
     * @param input the raw user input string
     * @param maxLength the maximum allowed character length
     * @param fieldName the human-readable field name for error reporting
     * @return the cleaned string
     * @throws IllegalArgumentException if the string is null, blank, or exceeds maxLength
     */
    public static String cleanRequiredString(String input, int maxLength, String fieldName) {
        if (input == null || input.isBlank()) {
            throw new IllegalArgumentException(fieldName + " is required and cannot be empty or whitespace.");
        }

        String trimmed = input.strip();

        if (trimmed.length() > maxLength) {
            throw new IllegalArgumentException(String.format(
                    "%s exceeds maximum permitted length of %d characters (received %d).",
                    fieldName, maxLength, trimmed.length()
            ));
        }

        return trimmed;
    }

    /**
     * Cleans an optional string field. If null or blank, returns null.
     * Otherwise trims whitespace and checks maximum length.
     *
     * @param input the raw input string
     * @param maxLength maximum allowed character length
     * @param fieldName the field name for error reporting
     * @return cleaned string or null
     */
    public static String cleanOptionalString(String input, int maxLength, String fieldName) {
        if (input == null || input.isBlank()) {
            return null;
        }

        String trimmed = input.strip();

        if (trimmed.length() > maxLength) {
            throw new IllegalArgumentException(String.format(
                    "%s exceeds maximum permitted length of %d characters (received %d).",
                    fieldName, maxLength, trimmed.length()
            ));
        }

        return trimmed;
    }

    /**
     * Normalizes a search term for case-insensitive matching using Locale.ROOT.
     * Trims whitespace and converts to lower case.
     *
     * @param query raw search query
     * @return normalized lower-case search query, or empty string if null
     */
    public static String normalizeSearchQuery(String query) {
        if (query == null || query.isBlank()) {
            return "";
        }
        return query.strip().toLowerCase(Locale.ROOT);
    }

    /**
     * Tests whether a patient record matches a given free-text search term.
     * Checks against patient name and token number using case-insensitive Locale.ROOT matching.
     *
     * @param patient the patient to check
     * @param normalizedQuery the lower-cased, trimmed search query
     * @return true if patient matches the query or if query is empty
     */
    public static boolean matchesSearch(Patient patient, String normalizedQuery) {
        if (patient == null) {
            return false;
        }
        if (normalizedQuery == null || normalizedQuery.isEmpty()) {
            return true;
        }

        String nameNormalized = patient.getName().toLowerCase(Locale.ROOT);
        String tokenNormalized = patient.getTokenNumber().toLowerCase(Locale.ROOT);

        return nameNormalized.contains(normalizedQuery) || tokenNormalized.contains(normalizedQuery);
    }

    /**
     * Tests whether a patient matches a specific department filter.
     *
     * @param patient the patient to check
     * @param departmentFilter the department name (case-insensitive)
     * @return true if department matches, or if filter is null/empty
     */
    public static boolean matchesDepartment(Patient patient, String departmentFilter) {
        if (patient == null) {
            return false;
        }
        if (departmentFilter == null || departmentFilter.isBlank()) {
            return true;
        }

        String normalizedFilter = departmentFilter.strip().toLowerCase(Locale.ROOT);
        String patientDeptNormalized = patient.getDepartment().toLowerCase(Locale.ROOT);

        return patientDeptNormalized.equalsIgnoreCase(normalizedFilter);
    }
}
