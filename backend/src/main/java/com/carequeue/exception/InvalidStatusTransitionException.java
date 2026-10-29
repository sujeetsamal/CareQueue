package com.carequeue.exception;

import com.carequeue.entity.PatientStatus;

/**
 * Thrown when an illegal lifecycle state transition is attempted on a patient.
 */
public class InvalidStatusTransitionException extends CareQueueException {

    public static final String CODE = "INVALID_STATUS_TRANSITION";

    public InvalidStatusTransitionException(PatientStatus current, PatientStatus target) {
        super(String.format("Cannot transition patient status from %s to %s.", current, target), CODE);
    }

    public InvalidStatusTransitionException(String message) {
        super(message, CODE);
    }
}
