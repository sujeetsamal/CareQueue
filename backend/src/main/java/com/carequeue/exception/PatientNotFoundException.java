package com.carequeue.exception;

/**
 * Thrown when a patient with a specified ID is not found in the queue or database.
 */
public class PatientNotFoundException extends CareQueueException {

    public static final String CODE = "PATIENT_NOT_FOUND";

    public PatientNotFoundException(String patientId) {
        super(String.format("Patient with ID '%s' was not found.", patientId), CODE);
    }
}
