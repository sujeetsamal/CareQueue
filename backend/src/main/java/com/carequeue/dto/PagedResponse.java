package com.carequeue.dto;

import java.util.List;

/**
 * Generic response DTO for backend-paginated datasets.
 */
public record PagedResponse<T>(
        List<T> content,
        int pageNumber,
        int pageSize,
        long totalElements,
        int totalPages,
        boolean isFirst,
        boolean isLast
) {
    public static <T> PagedResponse<T> of(
            List<T> content,
            int pageNumber,
            int pageSize,
            long totalElements
    ) {
        int totalPages = pageSize > 0 ? (int) Math.ceil((double) totalElements / pageSize) : 0;
        boolean isFirst = pageNumber <= 0;
        boolean isLast = pageNumber >= totalPages - 1;
        return new PagedResponse<>(content, pageNumber, pageSize, totalElements, totalPages, isFirst, isLast);
    }
}
