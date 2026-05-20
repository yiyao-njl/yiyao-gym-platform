package com.yiyao.gym.review.controller;

import com.yiyao.gym.common.api.ApiResponse;
import com.yiyao.gym.common.api.PageResponse;
import com.yiyao.gym.common.data.CommercialDataRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class ReviewController {
    private final CommercialDataRepository repository;

    public ReviewController(CommercialDataRepository repository) {
        this.repository = repository;
    }

    @PostMapping("/api/app/orders/{orderId}/review")
    public ApiResponse<Map<String, Object>> submit(@PathVariable String orderId, @RequestBody Map<String, Object> payload) {
        return ApiResponse.ok(Map.of("orderId", orderId, "reviewStatus", "PENDING_AUDIT", "submitted", true));
    }

    @GetMapping("/api/app/venues/{venueId}/reviews")
    public ApiResponse<List<Map<String, Object>>> list(@PathVariable String venueId) {
        return ApiResponse.ok(repository.reviews());
    }

    @GetMapping("/api/admin/reviews")
    public ApiResponse<PageResponse<Map<String, Object>>> adminReviews() {
        return ApiResponse.ok(PageResponse.of(1, 20, repository.reviews().size(), repository.reviews()));
    }

    @PatchMapping("/api/admin/reviews/{reviewId}")
    public ApiResponse<Map<String, Object>> patch(@PathVariable String reviewId, @RequestBody(required = false) Map<String, Object> payload) {
        return ApiResponse.ok(repository.updateReview(reviewId, payload == null ? Map.of() : payload));
    }
}
