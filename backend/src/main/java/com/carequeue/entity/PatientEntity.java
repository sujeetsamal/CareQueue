package com.carequeue.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;

/**
 * JPA Entity representing a patient record stored in the PostgreSQL database.
 */
@Entity
@Table(name = "patients", indexes = {
        @Index(name = "idx_patient_status", columnList = "status"),
        @Index(name = "idx_patient_registration_time", columnList = "registration_time"),
        @Index(name = "idx_patient_token_number", columnList = "token_number", unique = true),
        @Index(name = "idx_patients_date_dept", columnList = "queue_date, department_code")
})
public class PatientEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false, length = 36)
    private String id;

    @Column(name = "token_number", nullable = false, unique = true, length = 20)
    private String tokenNumber;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "age")
    private Integer age;

    @Column(name = "department", nullable = false, length = 50)
    private String department;

    @Column(name = "registration_time", nullable = false)
    private Instant registrationTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private PatientStatus status;

    @Column(name = "called_time")
    private Instant calledTime;

    @Column(name = "completed_time")
    private Instant completedTime;

    @Column(name = "notes", length = 250)
    private String notes;

    @Column(name = "queue_date")
    private LocalDate queueDate;

    @Column(name = "department_code", length = 10)
    private String departmentCode;

    @Column(name = "sequence_number")
    private Integer sequenceNumber;

    public PatientEntity() {
        // Default constructor for JPA
    }

    public PatientEntity(
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

    public PatientEntity(
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
        this.id = id;
        this.tokenNumber = tokenNumber;
        this.name = name;
        this.age = age;
        this.department = department;
        this.registrationTime = registrationTime;
        this.status = status;
        this.calledTime = calledTime;
        this.completedTime = completedTime;
        this.notes = notes;
        this.queueDate = queueDate;
        this.departmentCode = departmentCode;
        this.sequenceNumber = sequenceNumber;
    }

    /**
     * Converts this JPA entity to an immutable Patient domain object.
     */
    public Patient toDomain() {
        return new Patient(
                this.id,
                this.tokenNumber,
                this.name,
                this.age,
                this.department,
                this.registrationTime,
                this.status,
                this.calledTime,
                this.completedTime,
                this.notes,
                this.queueDate,
                this.departmentCode,
                this.sequenceNumber
        );
    }

    /**
     * Creates a new PatientEntity from a Patient domain object.
     */
    public static PatientEntity fromDomain(Patient domain) {
        return new PatientEntity(
                domain.getId(),
                domain.getTokenNumber(),
                domain.getName(),
                domain.getAge(),
                domain.getDepartment(),
                domain.getRegistrationTime(),
                domain.getStatus(),
                domain.getCalledTime(),
                domain.getCompletedTime(),
                domain.getNotes(),
                domain.getQueueDate(),
                domain.getDepartmentCode(),
                domain.getSequenceNumber()
        );
    }

    // Getters and Setters

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTokenNumber() {
        return tokenNumber;
    }

    public void setTokenNumber(String tokenNumber) {
        this.tokenNumber = tokenNumber;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public Instant getRegistrationTime() {
        return registrationTime;
    }

    public void setRegistrationTime(Instant registrationTime) {
        this.registrationTime = registrationTime;
    }

    public PatientStatus getStatus() {
        return status;
    }

    public void setStatus(PatientStatus status) {
        this.status = status;
    }

    public Instant getCalledTime() {
        return calledTime;
    }

    public void setCalledTime(Instant calledTime) {
        this.calledTime = calledTime;
    }

    public Instant getCompletedTime() {
        return completedTime;
    }

    public void setCompletedTime(Instant completedTime) {
        this.completedTime = completedTime;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDate getQueueDate() {
        return queueDate;
    }

    public void setQueueDate(LocalDate queueDate) {
        this.queueDate = queueDate;
    }

    public String getDepartmentCode() {
        return departmentCode;
    }

    public void setDepartmentCode(String departmentCode) {
        this.departmentCode = departmentCode;
    }

    public Integer getSequenceNumber() {
        return sequenceNumber;
    }

    public void setSequenceNumber(Integer sequenceNumber) {
        this.sequenceNumber = sequenceNumber;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PatientEntity that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
