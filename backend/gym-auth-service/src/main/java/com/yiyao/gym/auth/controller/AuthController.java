package com.yiyao.gym.auth.controller;

import com.yiyao.gym.auth.dto.AdminLoginRequest;
import com.yiyao.gym.auth.dto.WechatLoginRequest;
import com.yiyao.gym.auth.service.AuthService;
import com.yiyao.gym.auth.vo.LoginTokenVO;
import com.yiyao.gym.common.api.ApiResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/app/wechat-login")
    public ApiResponse<LoginTokenVO> wechatLogin(@RequestBody WechatLoginRequest request) {
        return ApiResponse.ok(authService.wechatLogin(request));
    }

    @PostMapping("/admin/login")
    public ApiResponse<LoginTokenVO> adminLogin(@RequestBody AdminLoginRequest request) {
        return ApiResponse.ok(authService.adminLogin(request));
    }

    @PostMapping("/sms/send")
    public ApiResponse<Map<String, Object>> sendSms(@RequestBody Map<String, Object> request) {
        return ApiResponse.ok(authService.sendSms(request));
    }

    @PostMapping("/sms/login")
    public ApiResponse<LoginTokenVO> smsLogin(@RequestBody Map<String, Object> request) {
        return ApiResponse.ok(authService.smsLogin(request));
    }

    @PostMapping("/token/refresh")
    public ApiResponse<LoginTokenVO> refresh() {
        return ApiResponse.ok(authService.refresh());
    }

    @PostMapping("/logout")
    public ApiResponse<Map<String, Object>> logout() {
        return ApiResponse.ok(Map.of("loggedOut", true));
    }

}
