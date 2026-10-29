package com.carequeue.dsa;

import com.carequeue.exception.StackEmptyException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Custom generic Last-In, First-Out (LIFO) stack implemented using singly linked nodes.
 *
 * This implementation strictly avoids java.util.Stack, java.util.ArrayDeque, and any library stacks.
 * It manages an internal top node reference and a size counter:
 * - O(1) Push (prepends to head/top)
 * - O(1) Pop (removes from head/top)
 * - O(1) Peek (examines head/top without mutation)
 * - O(1) Is empty / size check
 * - O(n) toListNewestFirst (traverses top to bottom to yield LIFO sequence)
 *
 * @param <T> the type of elements stored in the stack
 */
public class RecentCallsStack<T> {

    /**
     * Private static node for the singly linked stack.
     */
    private static class Node<E> {
        private final E item;
        private final Node<E> next;

        Node(E item, Node<E> next) {
            this.item = item;
            this.next = next;
        }
    }

    private Node<T> top;
    private int size;

    public RecentCallsStack() {
        this.top = null;
        this.size = 0;
    }

    /**
     * Pushes an item onto the top of the stack (most recent).
     * Time Complexity: O(1)
     *
     * @param item the item to push (must not be null)
     * @throws NullPointerException if item is null
     */
    public synchronized void push(T item) {
        Objects.requireNonNull(item, "Stack element cannot be null.");
        this.top = new Node<>(item, this.top);
        this.size++;
    }

    /**
     * Removes and returns the top item from the stack (most recent).
     * Time Complexity: O(1)
     *
     * @return the removed item
     * @throws StackEmptyException if the stack is empty
     */
    public synchronized T pop() {
        if (isEmpty()) {
            throw new StackEmptyException("Cannot pop from an empty stack.");
        }
        T item = top.item;
        top = top.next;
        size--;
        return item;
    }

    /**
     * Retrieves, but does not remove, the item at the top of the stack.
     * Used by the "Repeat Last Call" action to inspect the current announcement without mutation.
     * Time Complexity: O(1)
     *
     * @return the top item
     * @throws StackEmptyException if the stack is empty
     */
    public synchronized T peek() {
        if (isEmpty()) {
            throw new StackEmptyException("Cannot peek into an empty stack.");
        }
        return top.item;
    }

    /**
     * Retrieves, but does not remove, the item at the top as an Optional.
     * Time Complexity: O(1)
     *
     * @return Optional containing the top item, or empty Optional if stack is empty
     */
    public synchronized Optional<T> peekOptional() {
        if (isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(top.item);
    }

    /**
     * Checks if the stack contains zero elements.
     * Time Complexity: O(1)
     *
     * @return true if empty, false otherwise
     */
    public synchronized boolean isEmpty() {
        return size == 0;
    }

    /**
     * Returns the current number of elements in the stack.
     * Time Complexity: O(1)
     *
     * @return number of items
     */
    public synchronized int size() {
        return size;
    }

    /**
     * Returns an unmodifiable list of all items currently in the stack,
     * ordered newest-first (from top of stack down to bottom).
     * Time Complexity: O(n)
     *
     * @return unmodifiable List in LIFO order
     */
    public synchronized List<T> toListNewestFirst() {
        if (isEmpty()) {
            return Collections.emptyList();
        }

        List<T> result = new ArrayList<>(size);
        Node<T> current = top;
        while (current != null) {
            result.add(current.item);
            current = current.next;
        }
        return Collections.unmodifiableList(result);
    }

    /**
     * Resets the stack to empty.
     * Time Complexity: O(1)
     */
    public synchronized void clear() {
        this.top = null;
        this.size = 0;
    }
}
