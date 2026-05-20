package com.yiyao.gym.statistics.controller;

import com.yiyao.gym.common.api.ApiResponse;
import com.yiyao.gym.common.data.CommercialDataRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class StatisticsController {
    private final CommercialDataRepository repository;

    public StatisticsController(CommercialDataRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/api/admin/statistics/dashboard")
    public ApiResponse<Map<String, Object>> dashboard() {
        return ApiResponse.ok(repository.dashboard());
    }

    @GetMapping("/api/admin/statistics/overview")
    public ApiResponse<Map<String, Object>> statistics() {
        return ApiResponse.ok(repository.statistics());
    }
}
