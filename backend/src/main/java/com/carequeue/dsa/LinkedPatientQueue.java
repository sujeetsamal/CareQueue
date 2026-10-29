package com.carequeue.dsa;

import com.carequeue.entity.Patient;
import com.carequeue.exception.QueueEmptyException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Custom First-In, First-Out (FIFO) queue implemented as a singly linked list.
 *
 * This implementation strictly avoids java.util.Queue and java.util.LinkedList.
 * It manually manages references to head, tail, and size to guarantee:
 * - O(1) Enqueue at tail
 * - O(1) Dequeue from head
 * - O(1) Peek at head
 * - O(1) Size and Empty check
 * - O(n) Search by Patient ID
 * - O(n) Remove by Patient ID (handles head, tail, middle, and single-node reset)
 * - O(n) Snapshot creation
 */
public class LinkedPatientQueue {

    /**
     * Private static node representing an element in the singly linked list.
     * Encapsulates the patient reference and the pointer to the next node.
     */
    private static class Node {
        private final Patient patient;
        private Node next;

        Node(Patient patient) {
            this.patient = patient;
            this.next = null;
        }
    }

    private Node head;
    private Node tail;
    private int size;

    public LinkedPatientQueue() {
        this.head = null;
        this.tail = null;
        this.size = 0;
    }

    /**
     * Enqueues a new patient at the tail of the queue.
     * Time Complexity: O(1)
     *
     * @param patient the patient to enqueue (must not be null)
     * @throws NullPointerException if patient is null
     */
    public synchronized void enqueue(Patient patient) {
        Objects.requireNonNull(patient, "Patient cannot be null when enqueueing.");
        Node newNode = new Node(patient);

        if (isEmpty()) {
            head = newNode;
            tail = newNode;
        } else {
            tail.next = newNode;
            tail = newNode;
        }
        size++;
    }

    /**
     * Removes and returns the patient at the head of the queue (FIFO order).
     * Time Complexity: O(1)
     *
     * @return the dequeued Patient
     * @throws QueueEmptyException if the queue is empty
     */
    public synchronized Patient dequeue() {
        if (isEmpty()) {
            throw new QueueEmptyException("Cannot dequeue from an empty queue.");
        }

        Patient dequeuedPatient = head.patient;
        head = head.next;
        size--;

        if (size == 0) {
            // Queue is now empty; reset tail to preserve invariant
            head = null;
            tail = null;
        }

        return dequeuedPatient;
    }

    /**
     * Retrieves, but does not remove, the patient at the head of the queue.
     * Time Complexity: O(1)
     *
     * @return the patient at the head of the queue
     * @throws QueueEmptyException if the queue is empty
     */
    public synchronized Patient peek() {
        if (isEmpty()) {
            throw new QueueEmptyException("Cannot peek into an empty queue.");
        }
        return head.patient;
    }

    /**
     * Retrieves, but does not remove, the patient at the head of the queue as an Optional.
     * Time Complexity: O(1)
     *
     * @return Optional containing the head patient, or empty Optional if queue is empty
     */
    public synchronized Optional<Patient> peekOptional() {
        if (isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(head.patient);
    }

    /**
     * Checks whether the queue contains any waiting patients.
     * Time Complexity: O(1)
     *
     * @return true if size == 0, false otherwise
     */
    public synchronized boolean isEmpty() {
        return size == 0;
    }

    /**
     * Returns the exact number of patients waiting in the queue.
     * Time Complexity: O(1)
     *
     * @return current queue size
     */
    public synchronized int size() {
        return size;
    }

    /**
     * Searches for a patient by unique ID without altering the queue.
     * Time Complexity: O(n)
     *
     * @param patientId the unique patient identifier to find
     * @return Optional containing the found Patient, or empty Optional if absent
     */
    public synchronized Optional<Patient> findById(String patientId) {
        if (patientId == null || isEmpty()) {
            return Optional.empty();
        }

        Node current = head;
        while (current != null) {
            if (patientId.equals(current.patient.getId())) {
                return Optional.of(current.patient);
            }
            current = current.next;
        }

        return Optional.empty();
    }

    /**
     * Removes a patient by their unique ID from any position in the queue.
     * Correctly handles:
     * - Empty queue (returns empty Optional)
     * - Target is the only node (resets both head and tail to null)
     * - Target is at the head (advances head)
     * - Target is at the tail (updates tail to previous node)
     * - Target is in the middle (links previous to target.next)
     * Time Complexity: O(n)
     *
     * @param patientId the ID of the patient to remove
     * @return Optional containing the removed Patient, or empty Optional if not found
     */
    public synchronized Optional<Patient> removeById(String patientId) {
        if (patientId == null || isEmpty()) {
            return Optional.empty();
        }

        // Case 1: Target is at the head
        if (patientId.equals(head.patient.getId())) {
            Patient removed = head.patient;
            head = head.next;
            size--;
            if (size == 0) {
                head = null;
                tail = null;
            }
            return Optional.of(removed);
        }

        // Case 2: Target is somewhere after head (middle or tail)
        Node prev = head;
        Node current = head.next;

        while (current != null) {
            if (patientId.equals(current.patient.getId())) {
                Patient removed = current.patient;
                prev.next = current.next;

                // If removing the tail node, update tail to prev
                if (current == tail) {
                    tail = prev;
                }

                size--;
                return Optional.of(removed);
            }
            prev = current;
            current = current.next;
        }

        return Optional.empty();
    }

    /**
     * Produces an unmodifiable snapshot list of all waiting patients in strict FIFO order.
     * Does not expose internal Node references or allow external mutation.
     * Time Complexity: O(n)
     *
     * @return unmodifiable List of patients from head to tail
     */
    public synchronized List<Patient> snapshot() {
        if (isEmpty()) {
            return Collections.emptyList();
        }

        List<Patient> list = new ArrayList<>(size);
        Node current = head;
        while (current != null) {
            list.add(current.patient);
            current = current.next;
        }
        return Collections.unmodifiableList(list);
    }

    /**
     * Clears all elements from the queue and resets head, tail, and size.
     * Time Complexity: O(1)
     */
    public synchronized void clear() {
        head = null;
        tail = null;
        size = 0;
    }
}
