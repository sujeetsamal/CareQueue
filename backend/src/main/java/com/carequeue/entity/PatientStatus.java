package com.carequeue.entity;

/**
 * Enumeration representing the valid lifecycle statuses of a patient in CareQueue.
 *
 * Valid state transitions:
 * WAITING -> CALLED -> COMPLETED
 * WAITING -> CANCELLED
 */
public enum PatientStatus {
    WAITING,
    CALLED,
    COMPLETED,
    CANCELLED;

    /**
     * Determines whether transitioning from this status to the target status is permitted.
     *
     * @param target the desired next status
     * @return true if the transition is valid according to business rules
     */
    public boolean canTransitionTo(PatientStatus target) {
        if (target == null) {
            return false;
        }
        return switch (this) {
            case WAITING -> target == CALLED || target == CANCELLED;
            case CALLED -> target == COMPLETED;
            case COMPLETED, CANCELLED -> false; // Terminal states
        };
    }
}
