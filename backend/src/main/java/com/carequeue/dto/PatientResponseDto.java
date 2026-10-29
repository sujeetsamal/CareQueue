package com.carequeue.dto;

import com.carequeue.entity.Patient;
import com.carequeue.entity.PatientEntity;
import com.carequeue.entity.PatientStatus;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Outgoing response DTO representing a patient record for the frontend.
 */
public record PatientResponseDto(
        String id,
        String tokenNumber,
        String name,
        Integer age,
        String department,
        Instant registrationTime,
        PatientStatus status,
        Instant calledTime,
        Instant completedTime,
        String notes,
        Integer queuePosition,
        Long waitDurationSeconds,
        LocalDate queueDate,
        String departmentCode,
        Integer sequenceNumber
) {

    public static PatientResponseDto fromDomain(Patient patient, Integer queuePosition) {
        Long duration = null;
        if (patient.getRegistrationTime() != null) {
            Instant endTime = patient.getCalledTime() != null ? patient.getCalledTime() : Instant.now();
            duration = Duration.between(patient.getRegistrationTime(), endTime).getSeconds();
            if (duration < 0) duration = 0L;
        }

        return new PatientResponseDto(
                patient.getId(),
                patient.getTokenNumber(),
                patient.getName(),
                patient.getAge(),
                patient.getDepartment(),
                patient.getRegistrationTime(),
                patient.getStatus(),
                patient.getCalledTime(),
                patient.getCompletedTime(),
                patient.getNotes(),
                queuePosition,
                duration,
                patient.getQueueDate(),
                patient.getDepartmentCode(),
                patient.getSequenceNumber()
        );
    }

    public static PatientResponseDto fromEntity(PatientEntity entity, Integer queuePosition) {
        return fromDomain(entity.toDomain(), queuePosition);
    }
}
