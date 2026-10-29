package com.carequeue.exception;

/**
 * Thrown when an operation (such as dequeue or peek) is attempted on an empty queue.
 */
public class QueueEmptyException extends CareQueueException {

    public static final String CODE = "QUEUE_EMPTY";

    public QueueEmptyException() {
        super("No patients are currently waiting in the queue.", CODE);
    }

    public QueueEmptyException(String message) {
        super(message, CODE);
    }
}
