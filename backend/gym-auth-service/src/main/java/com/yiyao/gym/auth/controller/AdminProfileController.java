package com.yiyao.gym.auth.controller;

import com.yiyao.gym.common.api.ApiResponse;
import com.yiyao.gym.common.api.PageResponse;
import com.yiyao.gym.common.data.CommercialDataRepository;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class AdminProfileController {
    private final CommercialDataRepository repository;

    public AdminProfileController(CommercialDataRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/api/admin/me")
    public ApiResponse<Map<String, Object>> me(@RequestHeader(value = "X-Admin-Account", required = false) String account) {
        return ApiResponse.ok(repository.adminMe(account));
    }

    @GetMapping("/api/admin/accounts")
    public ApiResponse<PageResponse<Map<String, Object>>> accounts() {
        java.util.List<Map<String, Object>> records = repository.adminAccounts();
        return ApiResponse.ok(PageResponse.of(1, 20, records.size(), records));
    }

    @GetMapping("/api/admin/logs")
    public ApiResponse<PageResponse<Map<String, Object>>> logs() {
        java.util.List<Map<String, Object>> records = repository.logs();
        return ApiResponse.ok(PageResponse.of(1, 20, records.size(), records));
    }
}
