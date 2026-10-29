package com.carequeue.exception;

/**
 * Base unchecked exception for CareQueue business and data structure operations.
 */
public class CareQueueException extends RuntimeException {

    private final String errorCode;

    public CareQueueException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public CareQueueException(String message, String errorCode, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
