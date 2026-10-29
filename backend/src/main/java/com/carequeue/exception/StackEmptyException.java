package com.carequeue.exception;

/**
 * Thrown when an operation (such as pop or peek) is attempted on an empty recent calls stack.
 */
public class StackEmptyException extends CareQueueException {

    public static final String CODE = "STACK_EMPTY";

    public StackEmptyException() {
        super("No recently called patients are in the call history.", CODE);
    }

    public StackEmptyException(String message) {
        super(message, CODE);
    }
}
