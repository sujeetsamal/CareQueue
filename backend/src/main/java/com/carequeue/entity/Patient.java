package com.carequeue.entity;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;

/**
 * Immutable domain model representing a patient entry in the hospital queue.
 * Used across the custom DSA structures (LinkedPatientQueue and RecentCallsStack).
 */
public final class Patient {

    private final String id;
    private final String tokenNumber;
    private final String name;
    private final Integer age;
    private final String department;
    private final Instant registrationTime;
    private final PatientStatus status;
    private final Instant calledTime;
    private final Instant completedTime;
    private final String notes;
    private final LocalDate queueDate;
    private final String departmentCode;
    private final Integer sequenceNumber;

    public Patient(
            String id,
            String tokenNumber,
            String name,
            Integer age,
            String department,
            Instant registrationTime,
            PatientStatus status,
            Instant calledTime,
            Instant completedTime,
            String notes) {
        this(id, tokenNumber, name, age, department, registrationTime, status, calledTime, completedTime, notes, null, null, null);
    }

    public Patient(
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
            LocalDate queueDate,
            String departmentCode,
            Integer sequenceNumber) {
        this.id = Objects.requireNonNull(id, "Patient ID cannot be null");
        this.tokenNumber = Objects.requireNonNull(tokenNumber, "Token number cannot be null");
        this.name = Objects.requireNonNull(name, "Patient name cannot be null");
        this.age = age;
        this.department = Objects.requireNonNull(department, "Department cannot be null");
        this.registrationTime = Objects.requireNonNull(registrationTime, "Registration time cannot be null");
        this.status = Objects.requireNonNull(status, "Patient status cannot be null");
        this.calledTime = calledTime;
        this.completedTime = completedTime;
        this.notes = notes;
        this.queueDate = queueDate;
        this.departmentCode = departmentCode;
        this.sequenceNumber = sequenceNumber;
    }

    public String getId() {
        return id;
    }

    public String getTokenNumber() {
        return tokenNumber;
    }

    public String getName() {
        return name;
    }

    public Integer getAge() {
        return age;
    }

    public String getDepartment() {
        return department;
    }

    public Instant getRegistrationTime() {
        return registrationTime;
    }

    public PatientStatus getStatus() {
        return status;
    }

    public Instant getCalledTime() {
        return calledTime;
    }

    public Instant getCompletedTime() {
        return completedTime;
    }

    public String getNotes() {
        return notes;
    }

    public LocalDate getQueueDate() {
        return queueDate;
    }

    public String getDepartmentCode() {
        return departmentCode;
    }

    public Integer getSequenceNumber() {
        return sequenceNumber;
    }

    /**
     * Creates a new Patient instance with updated status and timestamp.
     */
    public Patient withCalled(Instant callTime) {
        return new Patient(
                this.id,
                this.tokenNumber,
                this.name,
                this.age,
                this.department,
                this.registrationTime,
                PatientStatus.CALLED,
                callTime,
                null,
                this.notes,
                this.queueDate,
                this.departmentCode,
                this.sequenceNumber
        );
    }

    public Patient withCompleted(Instant completeTime) {
        return new Patient(
                this.id,
                this.tokenNumber,
                this.name,
                this.age,
                this.department,
                this.registrationTime,
                PatientStatus.COMPLETED,
                this.calledTime,
                completeTime,
                this.notes,
                this.queueDate,
                this.departmentCode,
                this.sequenceNumber
        );
    }

    public Patient withCancelled() {
        return new Patient(
                this.id,
                this.tokenNumber,
                this.name,
                this.age,
                this.department,
                this.registrationTime,
                PatientStatus.CANCELLED,
                this.calledTime,
                this.completedTime,
                this.notes,
                this.queueDate,
                this.departmentCode,
                this.sequenceNumber
        );
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Patient other)) return false;
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Patient{" +
                "id='" + id + '\'' +
                ", tokenNumber='" + tokenNumber + '\'' +
                ", name='" + name + '\'' +
                ", department='" + department + '\'' +
                ", status=" + status +
                ", queueDate=" + queueDate +
                ", departmentCode='" + departmentCode + '\'' +
                ", sequenceNumber=" + sequenceNumber +
                '}';
    }
}
