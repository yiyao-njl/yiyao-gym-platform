package com.yiyao.gym.marketing.controller;

import com.yiyao.gym.common.api.ApiResponse;
import com.yiyao.gym.common.api.PageResponse;
import com.yiyao.gym.common.data.CommercialDataRepository;
import com.yiyao.gym.marketing.service.MarketingService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class MarketingController {
    private final MarketingService marketingService;
    private final CommercialDataRepository repository;

    public MarketingController(MarketingService marketingService, CommercialDataRepository repository) {
        this.marketingService = marketingService;
        this.repository = repository;
    }

    @GetMapping("/api/app/home")
    public ApiResponse<Map<String, Object>> home() {
        return ApiResponse.ok(Map.of(
                "banners", repository.activities(),
                "hotVenues", repository.venues().stream().limit(3).toList(),
                "activities", repository.activities(),
                "coupons", repository.coupons()
        ));
    }

    @GetMapping({"/api/app/banners", "/api/app/activities"})
    public ApiResponse<List<Map<String, Object>>> activities() {
        return ApiResponse.ok(repository.activities());
    }

    @GetMapping("/api/app/activities/{activityId}")
    public ApiResponse<Map<String, Object>> activity(@PathVariable String activityId) {
        return ApiResponse.ok(repository.activity(activityId));
    }

    @GetMapping({"/api/app/coupons", "/api/app/users/me/coupons"})
    public ApiResponse<List<Map<String, Object>>> coupons() {
        return ApiResponse.ok(repository.coupons());
    }

    @PostMapping("/api/app/coupons/{couponId}/claim")
    public ApiResponse<Map<String, Object>> claim(@PathVariable String couponId) {
        // TODO: Use Redis stock deduction plus MySQL final consistency and compensation.
        return ApiResponse.ok(Map.of("couponId", couponId, "claimed", true));
    }

    @GetMapping("/api/admin/coupons")
    public ApiResponse<PageResponse<Map<String, Object>>> adminCoupons() {
        return ApiResponse.ok(PageResponse.of(1, 20, repository.coupons().size(), repository.coupons()));
    }

    @GetMapping("/api/admin/activities")
    public ApiResponse<PageResponse<Map<String, Object>>> adminActivities() {
        return ApiResponse.ok(PageResponse.of(1, 20, repository.activities().size(), repository.activities()));
    }
}
