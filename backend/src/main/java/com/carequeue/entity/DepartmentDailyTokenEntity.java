package com.carequeue.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.Objects;

/**
 * JPA Entity representing the atomic daily counter for a specific department.
 * Mapped to table 'department_daily_tokens'.
 * Concurrency is maintained via SELECT FOR UPDATE pessimistic locking.
 */
@Entity
@Table(name = "department_daily_tokens")
public class DepartmentDailyTokenEntity {

    @EmbeddedId
    private DepartmentDailyTokenId id;

    @Column(name = "last_sequence", nullable = false)
    private int lastSequence;

    public DepartmentDailyTokenEntity() {
    }

    public DepartmentDailyTokenEntity(LocalDate queueDate, String departmentCode, int lastSequence) {
        this.id = new DepartmentDailyTokenId(queueDate, departmentCode);
        this.lastSequence = lastSequence;
    }

    public DepartmentDailyTokenId getId() {
        return id;
    }

    public void setId(DepartmentDailyTokenId id) {
        this.id = id;
    }

    public int getLastSequence() {
        return lastSequence;
    }

    public void setLastSequence(int lastSequence) {
        this.lastSequence = lastSequence;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof DepartmentDailyTokenEntity that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "DepartmentDailyTokenEntity{" +
                "id=" + id +
                ", lastSequence=" + lastSequence +
                '}';
    }
}
