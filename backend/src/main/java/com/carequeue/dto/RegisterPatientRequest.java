package com.carequeue.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Incoming request DTO for registering a new patient into the waiting queue.
 */
public record RegisterPatientRequest(
        @NotBlank(message = "Patient name is required.")
        @Size(min = 2, max = 100, message = "Patient name must be between 2 and 100 characters.")
        String name,

        @Min(value = 0, message = "Age cannot be negative.")
        @Max(value = 130, message = "Age cannot exceed 130 years.")
        Integer age,

        @NotBlank(message = "Department is required.")
        @Size(max = 50, message = "Department name cannot exceed 50 characters.")
        String department,

        @Size(max = 250, message = "Visit notes cannot exceed 250 characters.")
        String notes
) {
}
