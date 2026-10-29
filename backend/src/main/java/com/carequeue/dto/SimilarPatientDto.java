package com.carequeue.dto;

import com.carequeue.entity.PatientStatus;

import java.time.Instant;

/**
 * DTO representing an existing patient record identified during similarity checks.
 * Contains only non-sensitive identification fields needed for staff review.
 */
public record SimilarPatientDto(
        String id,
        String name,
        String tokenNumber,
        String department,
        Instant registrationTime,
        PatientStatus status,
        double similarityScore,
        boolean isWaiting
) {}
