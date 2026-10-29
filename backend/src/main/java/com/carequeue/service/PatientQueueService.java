package com.carequeue.service;

import com.carequeue.dsa.LinkedPatientQueue;
import com.carequeue.dsa.RecentCallsStack;
import com.carequeue.dsa.StringUtil;
import com.carequeue.dto.PagedResponse;
import com.carequeue.dto.PatientResponseDto;
import com.carequeue.dto.QueueStatsDto;
import com.carequeue.dto.RegisterPatientRequest;
import com.carequeue.entity.Patient;
import com.carequeue.entity.PatientEntity;
import com.carequeue.entity.PatientStatus;
import com.carequeue.exception.InvalidStatusTransitionException;
import com.carequeue.exception.PatientNotFoundException;
import com.carequeue.exception.QueueEmptyException;
import com.carequeue.repository.PatientRepository;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Service coordinating in-memory custom DSA structures (LinkedPatientQueue, RecentCallsStack)
 * with PostgreSQL persistent storage.
 *
 * Maintains thread-safe state synchronization across REST calls.
 */
@Service
public class PatientQueueService {

    private static final Logger log = LoggerFactory.getLogger(PatientQueueService.class);

    private final PatientRepository patientRepository;
    private final DepartmentTokenService departmentTokenService;
    private final LinkedPatientQueue waitingQueue;
    private final RecentCallsStack<Patient> recentCallsStack;

    @Value("${carequeue.seed-demo-data:false}")
    private boolean seedDemoData;

    public PatientQueueService(
            PatientRepository patientRepository,
            DepartmentTokenService departmentTokenService
    ) {
        this.patientRepository = patientRepository;
        this.departmentTokenService = departmentTokenService;
        this.waitingQueue = new LinkedPatientQueue();
        this.recentCallsStack = new RecentCallsStack<>();
    }

    /**
     * Initializes the custom DSA structures on application startup:
     * 1. Reconstructs LinkedPatientQueue with all persistent WAITING patients (FIFO order).
     * 2. Reconstructs RecentCallsStack with historical calls pushed oldest to newest so newest is at the top.
     * 3. Optionally seeds realistic fictional demo data if enabled and DB is empty.
     */
    @PostConstruct
    @Transactional
    public synchronized void initializeQueueState() {
        log.info("CareQueue initializing DSA state from database...");

        long totalCount = patientRepository.count();
        if (totalCount == 0 && seedDemoData) {
            seedFictionalDemoData();
        }

        // 1. Reconstruct LinkedPatientQueue (FIFO: oldest registration first)
        List<PatientEntity> waitingEntities = patientRepository.findByStatusOrderByRegistrationTimeAsc(PatientStatus.WAITING);
        waitingQueue.clear();
        for (PatientEntity entity : waitingEntities) {
            waitingQueue.enqueue(entity.toDomain());
        }
        log.info("Reconstructed LinkedPatientQueue with {} waiting patients.", waitingQueue.size());

        // 2. Reconstruct RecentCallsStack (LIFO: push oldest first so latest ends up at top)
        List<PatientEntity> historicalCalls = patientRepository.findCallHistoryForReconstruction();
        recentCallsStack.clear();
        for (PatientEntity entity : historicalCalls) {
            recentCallsStack.push(entity.toDomain());
        }
        log.info("Reconstructed RecentCallsStack with {} historical calls.", recentCallsStack.size());

        log.info("CareQueue startup initialization complete.");
    }

    /**
     * Registers a new patient into the waiting queue.
     * Uses StringUtil for validation, allocates a department-specific daily token,
     * persists to database, and enqueues into LinkedPatientQueue.
     */
    @Transactional
    public synchronized PatientResponseDto registerPatient(RegisterPatientRequest request) {
        String cleanedName = StringUtil.cleanRequiredString(request.name(), 100, "Patient name");
        String cleanedDept = StringUtil.cleanRequiredString(request.department(), 50, "Department");
        String cleanedNotes = StringUtil.cleanOptionalString(request.notes(), 250, "Visit notes");

        String id = UUID.randomUUID().toString();
        DepartmentTokenService.TokenAllocation allocation = departmentTokenService.allocateNextToken(cleanedDept);
        String token = allocation.tokenNumber();
        Instant now = Instant.now();

        Patient domain = new Patient(
                id,
                token,
                cleanedName,
                request.age(),
                cleanedDept,
                now,
                PatientStatus.WAITING,
                null,
                null,
                cleanedNotes,
                allocation.queueDate(),
                allocation.departmentCode(),
                allocation.sequenceNumber()
        );

        PatientEntity entity = PatientEntity.fromDomain(domain);
        patientRepository.save(entity);

        // Enqueue into custom linked-list queue (tail insertion: O(1))
        waitingQueue.enqueue(domain);
        log.info("Patient registered and enqueued: ID={}, Token={}, Name='{}', QueueSize={}",
                id, token, cleanedName, waitingQueue.size());

        return PatientResponseDto.fromDomain(domain, waitingQueue.size());
    }

    /**
     * Retrieves the current waiting queue snapshot in strict FIFO order with 1-based positions.
     */
    public synchronized List<PatientResponseDto> getWaitingQueue() {
        List<Patient> snapshot = waitingQueue.snapshot();
        List<PatientResponseDto> responseList = new ArrayList<>(snapshot.size());
        for (int i = 0; i < snapshot.size(); i++) {
            responseList.add(PatientResponseDto.fromDomain(snapshot.get(i), i + 1));
        }
        return responseList;
    }

    /**
     * Calls the next waiting patient:
     * 1. Dequeues head patient from LinkedPatientQueue (O(1)).
     * 2. Updates status to CALLED and records calledTime.
     * 3. Persists status change to database.
     * 4. Pushes patient snapshot onto RecentCallsStack (O(1)).
     */
    @Transactional
    public synchronized PatientResponseDto callNextPatient() {
        if (waitingQueue.isEmpty()) {
            throw new QueueEmptyException("No patients are currently waiting in the queue.");
        }

        Patient nextPatient = waitingQueue.dequeue();
        Instant callTime = Instant.now();
        Patient calledPatient = nextPatient.withCalled(callTime);

        // Update database
        PatientEntity entity = patientRepository.findById(calledPatient.getId())
                .orElseThrow(() -> new PatientNotFoundException(calledPatient.getId()));
        entity.setStatus(PatientStatus.CALLED);
        entity.setCalledTime(callTime);
        patientRepository.save(entity);

        // Push onto custom LIFO stack (O(1))
        recentCallsStack.push(calledPatient);
        log.info("Called next patient: Token={}, Name='{}', StackTop={}",
                calledPatient.getTokenNumber(), calledPatient.getName(), calledPatient.getId());

        return PatientResponseDto.fromDomain(calledPatient, null);
    }

    /**
     * Repeats the latest called patient announcement using RecentCallsStack.peek().
     * Does NOT mutate stack or waiting queue.
     */
    public synchronized PatientResponseDto repeatLastCall() {
        Patient lastCall = recentCallsStack.peek(); // throws StackEmptyException if empty
        log.info("Repeated last call announcement: Token={}, Name='{}'",
                lastCall.getTokenNumber(), lastCall.getName());
        return PatientResponseDto.fromDomain(lastCall, null);
    }

    /**
     * Returns recent calls ordered newest-first from the custom stack.
     */
    public synchronized List<PatientResponseDto> getRecentCalls() {
        List<Patient> list = recentCallsStack.toListNewestFirst();
        return list.stream()
                .map(p -> PatientResponseDto.fromDomain(p, null))
                .toList();
    }

    /**
     * Marks a currently CALLED patient as COMPLETED.
     */
    @Transactional
    public synchronized PatientResponseDto completePatient(String patientId) {
        PatientEntity entity = patientRepository.findById(patientId)
                .orElseThrow(() -> new PatientNotFoundException(patientId));

        if (!entity.getStatus().canTransitionTo(PatientStatus.COMPLETED)) {
            throw new InvalidStatusTransitionException(entity.getStatus(), PatientStatus.COMPLETED);
        }

        Instant completionTime = Instant.now();
        entity.setStatus(PatientStatus.COMPLETED);
        entity.setCompletedTime(completionTime);
        patientRepository.save(entity);

        log.info("Marked patient completed: ID={}, Token={}", patientId, entity.getTokenNumber());
        return PatientResponseDto.fromEntity(entity, null);
    }

    /**
     * Cancels a WAITING patient's queue entry after confirmation.
     * Removes from LinkedPatientQueue and updates database status to CANCELLED.
     */
    @Transactional
    public synchronized PatientResponseDto cancelWaitingPatient(String patientId) {
        PatientEntity entity = patientRepository.findById(patientId)
                .orElseThrow(() -> new PatientNotFoundException(patientId));

        if (!entity.getStatus().canTransitionTo(PatientStatus.CANCELLED)) {
            throw new InvalidStatusTransitionException(
                    String.format("Cannot cancel patient with status '%s'. Only WAITING patients can be cancelled.", entity.getStatus())
            );
        }

        // Remove from in-memory linked list queue (O(n))
        waitingQueue.removeById(patientId);

        entity.setStatus(PatientStatus.CANCELLED);
        patientRepository.save(entity);

        log.info("Cancelled waiting patient: ID={}, Token={}", patientId, entity.getTokenNumber());
        return PatientResponseDto.fromEntity(entity, null);
    }

    /**
     * Retrieves a single patient by ID, calculating queue position if currently waiting.
     */
    public synchronized PatientResponseDto getPatientById(String patientId) {
        PatientEntity entity = patientRepository.findById(patientId)
                .orElseThrow(() -> new PatientNotFoundException(patientId));

        Integer queuePos = null;
        if (entity.getStatus() == PatientStatus.WAITING) {
            List<Patient> snapshot = waitingQueue.snapshot();
            for (int i = 0; i < snapshot.size(); i++) {
                if (snapshot.get(i).getId().equals(patientId)) {
                    queuePos = i + 1;
                    break;
                }
            }
        }

        return PatientResponseDto.fromEntity(entity, queuePos);
    }

    /**
     * Lists all patients with optional search term, department, and status filters.
     */
    public synchronized List<PatientResponseDto> searchAndFilterPatients(
            String searchQuery,
            String departmentFilter,
            PatientStatus statusFilter) {

        String normalizedQuery = StringUtil.normalizeSearchQuery(searchQuery);
        List<PatientEntity> allEntities = patientRepository.findAllByOrderByRegistrationTimeDesc();

        return allEntities.stream()
                .map(PatientEntity::toDomain)
                .filter(p -> statusFilter == null || p.getStatus() == statusFilter)
                .filter(p -> StringUtil.matchesDepartment(p, departmentFilter))
                .filter(p -> StringUtil.matchesSearch(p, normalizedQuery))
                .map(p -> PatientResponseDto.fromDomain(p, null))
                .toList();
    }

    /**
     * Full-featured backend pagination, search, and filtering for the Patient Registry.
     * Does NOT affect or mutate the in-memory waiting queue.
     */
    @Transactional(readOnly = true)
    public PagedResponse<PatientResponseDto> getPatientsPaged(
            int page,
            int size,
            String search,
            String department,
            PatientStatus status,
            String sortBy,
            LocalDate startDate,
            LocalDate endDate
    ) {
        Specification<PatientEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String searchTrimmed = search.trim();
                String term = "%" + searchTrimmed.toLowerCase(Locale.ROOT) + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("name")), term);
                Predicate tokenLike = cb.like(cb.upper(root.get("tokenNumber")), "%" + searchTrimmed.toUpperCase(Locale.ROOT) + "%");
                Predicate deptLike = cb.like(cb.lower(root.get("department")), term);
                Predicate idLike = cb.like(cb.lower(root.get("id")), term);
                predicates.add(cb.or(nameLike, tokenLike, deptLike, idLike));
            }

            if (department != null && !department.isBlank() && !"ALL".equalsIgnoreCase(department)) {
                predicates.add(cb.equal(cb.lower(root.get("department")), department.trim().toLowerCase(Locale.ROOT)));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (startDate != null) {
                Instant startInstant = startDate.atStartOfDay(DepartmentTokenService.QUEUE_TIMEZONE).toInstant();
                predicates.add(cb.greaterThanOrEqualTo(root.get("registrationTime"), startInstant));
            }

            if (endDate != null) {
                Instant endInstant = endDate.plusDays(1).atStartOfDay(DepartmentTokenService.QUEUE_TIMEZONE).toInstant();
                predicates.add(cb.lessThan(root.get("registrationTime"), endInstant));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Sort sort = resolveSort(sortBy);
        int validPage = Math.max(0, page);
        int validSize = Math.max(1, Math.min(100, size));
        PageRequest pageRequest = PageRequest.of(validPage, validSize, sort);

        Page<PatientEntity> pageResult = patientRepository.findAll(spec, pageRequest);

        List<PatientResponseDto> dtos = pageResult.getContent().stream()
                .map(entity -> PatientResponseDto.fromEntity(entity, null))
                .toList();

        return PagedResponse.of(dtos, pageResult.getNumber(), pageResult.getSize(), pageResult.getTotalElements());
    }

    private Sort resolveSort(String sortBy) {
        if (sortBy == null || sortBy.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "registrationTime");
        }
        return switch (sortBy.toLowerCase(Locale.ROOT)) {
            case "oldest" -> Sort.by(Sort.Direction.ASC, "registrationTime");
            case "name_asc" -> Sort.by(Sort.Direction.ASC, "name");
            case "name_desc" -> Sort.by(Sort.Direction.DESC, "name");
            case "token_asc" -> Sort.by(Sort.Direction.ASC, "tokenNumber");
            case "token_desc" -> Sort.by(Sort.Direction.DESC, "tokenNumber");
            case "department_asc" -> Sort.by(Sort.Direction.ASC, "department");
            case "status_asc" -> Sort.by(Sort.Direction.ASC, "status");
            default -> Sort.by(Sort.Direction.DESC, "registrationTime");
        };
    }

    /**
     * Calculates real dashboard queue statistics:
     * - Waiting count from LinkedPatientQueue
     * - Called today count
     * - Completed today count
     * - Real calculated average waiting time (in minutes) from registration to call time
     * Uses Asia/Kolkata timezone to determine start of today.
     */
    public synchronized QueueStatsDto getQueueStats() {
        long waiting = waitingQueue.size();
        LocalDate todayInKolkata = LocalDate.now(DepartmentTokenService.QUEUE_TIMEZONE);
        Instant startOfToday = todayInKolkata.atStartOfDay(DepartmentTokenService.QUEUE_TIMEZONE).toInstant();

        long calledToday = patientRepository.countCalledSince(startOfToday);
        long completedToday = patientRepository.countCompletedSince(startOfToday);

        List<PatientEntity> completedList = patientRepository.findCompletedSince(startOfToday);
        Double avgWaitMinutes = null;

        if (!completedList.isEmpty()) {
            long totalWaitSeconds = 0;
            int validCount = 0;
            for (PatientEntity p : completedList) {
                if (p.getRegistrationTime() != null && p.getCalledTime() != null) {
                    long waitSec = Duration.between(p.getRegistrationTime(), p.getCalledTime()).getSeconds();
                    if (waitSec >= 0) {
                        totalWaitSeconds += waitSec;
                        validCount++;
                    }
                }
            }
            if (validCount > 0) {
                double avgSec = (double) totalWaitSeconds / validCount;
                avgWaitMinutes = Math.round((avgSec / 60.0) * 10.0) / 10.0;
            }
        }

        return new QueueStatsDto(waiting, calledToday, completedToday, avgWaitMinutes);
    }

    /**
     * Seeds realistic fictional patient demo records for demonstration purposes.
     * Idempotent: only called if database is initially empty AND demo seeding is explicitly enabled.
     */
    private void seedFictionalDemoData() {
        log.info("Seeding fictional demo patients for CareQueue demonstration...");
        Instant now = Instant.now();
        LocalDate today = LocalDate.now(DepartmentTokenService.QUEUE_TIMEZONE);

        // 1. Completed patient (called 45 min ago, completed 20 min ago)
        PatientEntity p1 = new PatientEntity(
                UUID.randomUUID().toString(),
                "GEN-001",
                "Maya Lin",
                34,
                "General Medicine",
                now.minus(50, ChronoUnit.MINUTES),
                PatientStatus.COMPLETED,
                now.minus(45, ChronoUnit.MINUTES),
                now.minus(20, ChronoUnit.MINUTES),
                "Mild seasonal allergies",
                today,
                "GEN",
                1
        );

        // 2. Currently Called patient (called 5 min ago)
        PatientEntity p2 = new PatientEntity(
                UUID.randomUUID().toString(),
                "CRD-001",
                "Carlos Mendez",
                58,
                "Cardiology",
                now.minus(30, ChronoUnit.MINUTES),
                PatientStatus.CALLED,
                now.minus(5, ChronoUnit.MINUTES),
                null,
                "Blood pressure monitoring",
                today,
                "CRD",
                1
        );

        // 3. Waiting patient #1
        PatientEntity p3 = new PatientEntity(
                UUID.randomUUID().toString(),
                "PED-001",
                "Liam O'Connor",
                7,
                "Pediatrics",
                now.minus(15, ChronoUnit.MINUTES),
                PatientStatus.WAITING,
                null,
                null,
                "Routine immunization",
                today,
                "PED",
                1
        );

        // 4. Waiting patient #2
        PatientEntity p4 = new PatientEntity(
                UUID.randomUUID().toString(),
                "ORT-001",
                "Priya Patel",
                29,
                "Orthopedics",
                now.minus(10, ChronoUnit.MINUTES),
                PatientStatus.WAITING,
                null,
                null,
                "Follow-up for sprained wrist",
                today,
                "ORT",
                1
        );

        // 5. Waiting patient #3
        PatientEntity p5 = new PatientEntity(
                UUID.randomUUID().toString(),
                "GEN-002",
                "Hassan Al-Mansoor",
                45,
                "General Medicine",
                now.minus(3, ChronoUnit.MINUTES),
                PatientStatus.WAITING,
                null,
                null,
                "Annual health screening",
                today,
                "GEN",
                2
        );

        patientRepository.saveAll(List.of(p1, p2, p3, p4, p5));
        log.info("Fictional demo data seeded successfully.");
    }
}
