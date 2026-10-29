package com.carequeue.service;

import com.carequeue.entity.DepartmentDailyTokenEntity;
import com.carequeue.entity.DepartmentDailyTokenId;
import com.carequeue.repository.DepartmentDailyTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * Service managing department-specific daily queue token counters.
 * Enforces format: PREFIX-NNN (e.g., GEN-001, CRD-001, PED-001).
 *
 * Sequence resets every day in the 'Asia/Kolkata' timezone.
 * Concurrency is guaranteed via pessimistic row-level database locking (SELECT FOR UPDATE).
 */
@Service
public class DepartmentTokenService {

    private static final Logger log = LoggerFactory.getLogger(DepartmentTokenService.class);
    public static final ZoneId QUEUE_TIMEZONE = ZoneId.of("Asia/Kolkata");

    private static final Map<String, String> DEPARTMENT_PREFIX_MAP = Map.of(
            "GENERAL MEDICINE", "GEN",
            "CARDIOLOGY", "CRD",
            "PEDIATRICS", "PED",
            "ORTHOPEDICS", "ORT",
            "DERMATOLOGY", "DER",
            "EMERGENCY", "EMG"
    );

    private final DepartmentDailyTokenRepository tokenRepository;

    public record TokenAllocation(
            String tokenNumber,
            String departmentCode,
            LocalDate queueDate,
            int sequenceNumber
    ) {}

    public DepartmentTokenService(DepartmentDailyTokenRepository tokenRepository) {
        this.tokenRepository = tokenRepository;
    }

    /**
     * Resolves the canonical 3-letter prefix for a department name.
     */
    public String resolveDepartmentCode(String department) {
        if (department == null || department.isBlank()) {
            return "GEN";
        }
        String upper = department.trim().toUpperCase(Locale.ROOT);
        if (DEPARTMENT_PREFIX_MAP.containsKey(upper)) {
            return DEPARTMENT_PREFIX_MAP.get(upper);
        }
        // Partial substring checks
        if (upper.contains("EMERGENCY")) return "EMG";
        if (upper.contains("CARDIO")) return "CRD";
        if (upper.contains("PEDIATRIC")) return "PED";
        if (upper.contains("ORTHO")) return "ORT";
        if (upper.contains("DERMAT")) return "DER";
        if (upper.contains("GENERAL")) return "GEN";

        // Check if already a 3-letter uppercase code
        if (upper.matches("^[A-Z]{3}$")) {
            return upper;
        }

        return "GEN";
    }

    /**
     * Atomically allocates the next sequential daily token for a given department.
     * Uses Asia/Kolkata timezone to determine current local calendar date.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public synchronized TokenAllocation allocateNextToken(String department) {
        LocalDate today = LocalDate.now(QUEUE_TIMEZONE);
        return allocateNextTokenForDate(department, today);
    }

    /**
     * Atomically allocates the next token for an explicit date.
     * Guaranteed thread-safe and transactional.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public synchronized TokenAllocation allocateNextTokenForDate(String department, LocalDate queueDate) {
        String deptCode = resolveDepartmentCode(department);

        int allocatedSeq;
        Optional<DepartmentDailyTokenEntity> lockedOpt = tokenRepository.findByIdForUpdate(queueDate, deptCode);

        if (lockedOpt.isPresent()) {
            DepartmentDailyTokenEntity counter = lockedOpt.get();
            allocatedSeq = counter.getLastSequence() + 1;
            counter.setLastSequence(allocatedSeq);
            tokenRepository.saveAndFlush(counter);
        } else {
            // First token of the day for this department
            try {
                DepartmentDailyTokenEntity newCounter = new DepartmentDailyTokenEntity(queueDate, deptCode, 1);
                tokenRepository.saveAndFlush(newCounter);
                allocatedSeq = 1;
            } catch (DataIntegrityViolationException ex) {
                // Handled in case of simultaneous initial insert
                DepartmentDailyTokenEntity existing = tokenRepository.findByIdForUpdate(queueDate, deptCode)
                        .orElseThrow(() -> new IllegalStateException("Failed to acquire counter for " + deptCode + " on " + queueDate));
                allocatedSeq = existing.getLastSequence() + 1;
                existing.setLastSequence(allocatedSeq);
                tokenRepository.saveAndFlush(existing);
            }
        }

        String tokenNumber = String.format("%s-%03d", deptCode, allocatedSeq);
        log.info("Allocated token {} for department '{}' (Code: {}, Date: {}, Seq: {})",
                tokenNumber, department, deptCode, queueDate, allocatedSeq);

        return new TokenAllocation(tokenNumber, deptCode, queueDate, allocatedSeq);
    }
}
