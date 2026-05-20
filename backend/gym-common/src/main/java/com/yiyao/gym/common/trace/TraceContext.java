package com.yiyao.gym.common.trace;

import java.util.UUID;

public final class TraceContext {
    public static final String TRACE_ID_HEADER = "X-Trace-Id";
    private static final ThreadLocal<String> HOLDER = new ThreadLocal<>();

    private TraceContext() {
    }

    public static String traceId() {
        String traceId = HOLDER.get();
        if (traceId == null || traceId.isBlank()) {
            traceId = UUID.randomUUID().toString();
            HOLDER.set(traceId);
        }
        return traceId;
    }

    public static void set(String traceId) {
        HOLDER.set(traceId == null || traceId.isBlank() ? UUID.randomUUID().toString() : traceId);
    }

    public static void clear() {
        HOLDER.remove();
    }
}
