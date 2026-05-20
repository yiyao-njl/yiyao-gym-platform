package com.yiyao.gym.common.api;

import java.util.List;

public record PageResponse<T>(long pageNo, long pageSize, long total, long totalPages, List<T> records) {
    public static <T> PageResponse<T> of(long pageNo, long pageSize, long total, List<T> records) {
        long safeSize = Math.max(pageSize, 1);
        long totalPages = total == 0 ? 0 : (total + safeSize - 1) / safeSize;
        return new PageResponse<>(pageNo, safeSize, total, totalPages, records == null ? List.of() : records);
    }
}
