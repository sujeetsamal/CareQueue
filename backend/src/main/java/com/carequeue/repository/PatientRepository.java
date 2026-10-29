package com.carequeue.repository;

import com.carequeue.entity.PatientEntity;
import com.carequeue.entity.PatientStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<PatientEntity, String> {

    /**
     * Finds all patients currently waiting, ordered chronologically by registration time (FIFO).
     */
    List<PatientEntity> findByStatusOrderByRegistrationTimeAsc(PatientStatus status);

    /**
     * Finds historical calls for startup stack reconstruction.
     * Ordered oldest to newest so they can be pushed onto the stack in order,
     * leaving the latest call at the top of the stack.
     */
    @Query("SELECT p FROM PatientEntity p WHERE p.calledTime IS NOT NULL AND (p.status = 'CALLED' OR p.status = 'COMPLETED') ORDER BY p.calledTime ASC")
    List<PatientEntity> findCallHistoryForReconstruction();

    /**
     * Finds all patients ordered newest registration first.
     */
    List<PatientEntity> findAllByOrderByRegistrationTimeDesc();

    /**
     * Checks if a token number already exists.
     */
    boolean existsByTokenNumber(String tokenNumber);

    /**
     * Finds a patient by token number.
     */
    Optional<PatientEntity> findByTokenNumber(String tokenNumber);

    /**
     * Counts patients by status.
     */
    long countByStatus(PatientStatus status);

    /**
     * Counts patients called on or after a given timestamp (e.g. start of today).
     */
    @Query("SELECT COUNT(p) FROM PatientEntity p WHERE p.calledTime >= :since")
    long countCalledSince(@Param("since") Instant since);

    /**
     * Counts patients completed on or after a given timestamp (e.g. start of today).
     */
    @Query("SELECT COUNT(p) FROM PatientEntity p WHERE p.status = 'COMPLETED' AND p.completedTime >= :since")
    long countCompletedSince(@Param("since") Instant since);

    /**
     * Finds all completed patients with non-null registration and completed times
     * since a given instant, used to calculate exact average wait time.
     */
    @Query("SELECT p FROM PatientEntity p WHERE p.status = 'COMPLETED' AND p.completedTime >= :since AND p.calledTime IS NOT NULL")
    List<PatientEntity> findCompletedSince(@Param("since") Instant since);

    /**
     * Returns total count of all registrations ever created, used for sequence generation.
     */
    long count();
}
