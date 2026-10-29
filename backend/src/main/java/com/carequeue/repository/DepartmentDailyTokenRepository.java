package com.carequeue.repository;

import com.carequeue.entity.DepartmentDailyTokenEntity;
import com.carequeue.entity.DepartmentDailyTokenId;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface DepartmentDailyTokenRepository extends JpaRepository<DepartmentDailyTokenEntity, DepartmentDailyTokenId> {

    /**
     * Finds the department counter entity for a specific date with a PESSIMISTIC_WRITE lock.
     * Generates 'SELECT ... FOR UPDATE' in PostgreSQL, ensuring strict transactional serialization
     * during concurrent registrations.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM DepartmentDailyTokenEntity d WHERE d.id.queueDate = :queueDate AND d.id.departmentCode = :departmentCode")
    Optional<DepartmentDailyTokenEntity> findByIdForUpdate(
            @Param("queueDate") LocalDate queueDate,
            @Param("departmentCode") String departmentCode
    );
}
