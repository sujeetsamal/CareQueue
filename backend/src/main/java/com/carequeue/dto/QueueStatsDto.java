package com.carequeue.dto;

/**
 * DTO carrying dashboard queue metrics calculated from real timestamps and records.
 */
public record QueueStatsDto(
        long waitingCount,
        long calledTodayCount,
        long completedTodayCount,
        Double averageWaitTimeMinutes
) {
}
