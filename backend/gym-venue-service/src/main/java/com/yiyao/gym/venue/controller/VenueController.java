package com.yiyao.gym.venue.controller;

import com.yiyao.gym.common.api.ApiResponse;
import com.yiyao.gym.common.api.PageResponse;
import com.yiyao.gym.venue.dto.ReservationCheckRequest;
import com.yiyao.gym.venue.service.VenueQueryService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
public class VenueController {
    private final VenueQueryService venueQueryService;

    public VenueController(VenueQueryService venueQueryService) {
        this.venueQueryService = venueQueryService;
    }

    @GetMapping("/api/app/cities")
    public ApiResponse<List<Map<String, Object>>> cities() {
        return ApiResponse.ok(venueQueryService.cities());
    }

    @GetMapping({"/api/app/stores", "/api/app/stores/nearby"})
    public ApiResponse<PageResponse<Map<String, Object>>> stores() {
        return ApiResponse.ok(PageResponse.of(1, 20, venueQueryService.stores().size(), venueQueryService.stores()));
    }

    @GetMapping("/api/app/stores/{storeId}")
    public ApiResponse<Map<String, Object>> store(@PathVariable String storeId) {
        return ApiResponse.ok(venueQueryService.store(storeId));
    }

    @GetMapping("/api/app/stores/{storeId}/venue-types")
    public ApiResponse<List<Map<String, Object>>> venueTypes(@PathVariable String storeId) {
        return ApiResponse.ok(venueQueryService.venueTypes());
    }

    @GetMapping("/api/app/venues")
    public ApiResponse<PageResponse<Map<String, Object>>> venues() {
        return ApiResponse.ok(PageResponse.of(1, 20, venueQueryService.venues().size(), venueQueryService.venues()));
    }

    @GetMapping("/api/app/venues/{venueId}")
    public ApiResponse<Map<String, Object>> venue(@PathVariable String venueId) {
        Map<String, Object> venue = venueQueryService.venue(venueId);
        LinkedHashMap<String, Object> detail = new LinkedHashMap<>(venue);
        detail.put("packages", venueQueryService.packages());
        detail.put("slots", venueQueryService.slots(venueId, LocalDate.now()));
        return ApiResponse.ok(detail);
    }

    @GetMapping("/api/app/venues/{venueId}/slots")
    public ApiResponse<List<Map<String, Object>>> slots(@PathVariable String venueId, @RequestParam(required = false) String bizDate) {
        return ApiResponse.ok(venueQueryService.slots(venueId, bizDate == null || bizDate.isBlank() ? LocalDate.now() : LocalDate.parse(bizDate)));
    }

    @PostMapping("/api/app/reservations/check")
    public ApiResponse<Map<String, Object>> check(@RequestBody ReservationCheckRequest request) {
        boolean available = venueQueryService.isAvailable(request.venueId(), request.bizDate(), request.startTime(), request.endTime());
        return ApiResponse.ok(Map.of(
                "available", available,
                "lockRequired", available,
                "reason", available ? "" : "场地时段已被占用或时间无效"
        ));
    }

    @PostMapping("/api/app/reservations/scan-open")
    public ApiResponse<Map<String, Object>> scanOpen() {
        return ApiResponse.ok(Map.of("verified", true, "mode", "WALK_IN"));
    }

    @GetMapping("/api/admin/stores")
    public ApiResponse<PageResponse<Map<String, Object>>> adminStores() {
        return ApiResponse.ok(PageResponse.of(1, 20, venueQueryService.stores().size(), venueQueryService.stores()));
    }

    @GetMapping("/api/admin/venues")
    public ApiResponse<PageResponse<Map<String, Object>>> adminVenues() {
        return ApiResponse.ok(PageResponse.of(1, 20, venueQueryService.venues().size(), venueQueryService.venues()));
    }

    @GetMapping("/api/admin/venue-types")
    public ApiResponse<List<Map<String, Object>>> adminVenueTypes() {
        return ApiResponse.ok(venueQueryService.venueTypes());
    }

    @GetMapping("/api/admin/venue-packages")
    public ApiResponse<PageResponse<Map<String, Object>>> adminPackages() {
        return ApiResponse.ok(PageResponse.of(1, 20, venueQueryService.packages().size(), venueQueryService.packages()));
    }

    @PatchMapping({"/api/admin/stores/{storeId}", "/api/admin/venues/{venueId}"})
    public ApiResponse<Map<String, Object>> adminPatch(@PathVariable Map<String, String> pathVariables, @RequestBody(required = false) Map<String, Object> payload) {
        if (pathVariables.containsKey("storeId")) {
            return ApiResponse.ok(venueQueryService.updateStore(pathVariables.get("storeId"), payload == null ? Map.of() : payload));
        }
        return ApiResponse.ok(venueQueryService.updateVenue(pathVariables.get("venueId"), payload == null ? Map.of() : payload));
    }
}
