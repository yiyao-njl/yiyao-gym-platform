package com.yiyao.gym.common.api;

import com.yiyao.gym.common.trace.TraceContext;

public record ApiResponse<T>(String code, String message, T data, String detail, String traceId) {
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(ErrorCode.SUCCESS.name(), ErrorCode.SUCCESS.message(), data, null, TraceContext.traceId());
    }

    public static <T> ApiResponse<T> fail(ErrorCode code, String detail) {
        return new ApiResponse<>(code.name(), code.message(), null, detail, TraceContext.traceId());
    }
}
