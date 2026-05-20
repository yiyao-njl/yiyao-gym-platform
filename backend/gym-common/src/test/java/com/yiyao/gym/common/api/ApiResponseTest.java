package com.yiyao.gym.common.api;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ApiResponseTest {
    @Test
    void successResponseIncludesTraceId() {
        ApiResponse<String> response = ApiResponse.ok("ok");
        assertThat(response.code()).isEqualTo(ErrorCode.SUCCESS.name());
        assertThat(response.data()).isEqualTo("ok");
        assertThat(response.traceId()).isNotBlank();
    }

    @Test
    void pageResponseCalculatesTotalPages() {
        PageResponse<String> page = PageResponse.of(1, 10, 21, List.of("a"));
        assertThat(page.totalPages()).isEqualTo(3);
        assertThat(page.records()).containsExactly("a");
    }
}
