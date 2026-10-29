package com.carequeue.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;

/**
 * Composite Primary Key for DepartmentDailyTokenEntity:
 * Identifies a specific department's counter for a specific local calendar date.
 */
@Embeddable
public class DepartmentDailyTokenId implements Serializable {

    @Column(name = "queue_date", nullable = false)
    private LocalDate queueDate;

    @Column(name = "department_code", nullable = false, length = 10)
    private String departmentCode;

    public DepartmentDailyTokenId() {
    }

    public DepartmentDailyTokenId(LocalDate queueDate, String departmentCode) {
        this.queueDate = Objects.requireNonNull(queueDate, "Queue date cannot be null");
        this.departmentCode = Objects.requireNonNull(departmentCode, "Department code cannot be null");
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof DepartmentDailyTokenId that)) return false;
        return Objects.equals(queueDate, that.queueDate) && Objects.equals(departmentCode, that.departmentCode);
    }

    @Override
    public int hashCode() {
        return Objects.hash(queueDate, departmentCode);
    }

    @Override
    public String toString() {
        return "DepartmentDailyTokenId{" +
                "queueDate=" + queueDate +
                ", departmentCode='" + departmentCode + '\'' +
                '}';
    }
}
