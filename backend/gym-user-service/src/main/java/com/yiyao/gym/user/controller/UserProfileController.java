package com.yiyao.gym.user.controller;

import com.yiyao.gym.common.api.ApiResponse;
import com.yiyao.gym.common.api.PageResponse;
import com.yiyao.gym.user.dto.UpdateUserProfileRequest;
import com.yiyao.gym.user.service.UserProfileService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/app/users/me")
public class UserProfileController {
    private final UserProfileService userProfileService;

    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping
    public ApiResponse<Map<String, Object>> me() {
        return ApiResponse.ok(userProfileService.me());
    }

    @GetMapping("/summary")
    public ApiResponse<Map<String, Object>> summary() {
        return ApiResponse.ok(userProfileService.me());
    }

    @PutMapping
    public ApiResponse<Map<String, Object>> update(@RequestBody UpdateUserProfileRequest request) {
        return ApiResponse.ok(Map.of("updated", true, "nickname", request.nickname()));
    }

    @GetMapping("/points")
    public ApiResponse<PageResponse<Map<String, Object>>> points() {
        return ApiResponse.ok(PageResponse.of(1, 10, userProfileService.points().size(), userProfileService.points()));
    }
}
