package com.carequeue.dto;

import java.time.Instant;
import java.util.Map;

/**
 * Standardized JSON error response returned across all API endpoints.
 */
public record ApiErrorResponse(
        String message,
        String code,
        Instant timestamp,
        Map<String, String> fieldErrors
) {
    public ApiErrorResponse(String message, String code) {
        this(message, code, Instant.now(), null);
    }

    public ApiErrorResponse(String message, String code, Map<String, String> fieldErrors) {
        this(message, code, Instant.now(), fieldErrors);
    }
}
