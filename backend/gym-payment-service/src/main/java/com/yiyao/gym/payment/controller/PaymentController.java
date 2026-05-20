package com.yiyao.gym.payment.controller;

import com.yiyao.gym.common.api.ApiResponse;
import com.yiyao.gym.common.api.PageResponse;
import com.yiyao.gym.payment.dto.CreatePaymentRequest;
import com.yiyao.gym.payment.service.PaymentAppService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class PaymentController {
    private final PaymentAppService paymentAppService;

    public PaymentController(PaymentAppService paymentAppService) {
        this.paymentAppService = paymentAppService;
    }

    @PostMapping("/api/app/payments")
    public ApiResponse<Map<String, Object>> create(@RequestBody CreatePaymentRequest request) {
        return ApiResponse.ok(paymentAppService.create(request));
    }

    @GetMapping("/api/app/payments/{paymentNo}")
    public ApiResponse<Map<String, Object>> status(@PathVariable String paymentNo) {
        return ApiResponse.ok(paymentAppService.status(paymentNo));
    }

    @PostMapping("/api/app/payments/wechat/callback")
    public ApiResponse<Map<String, Object>> paymentCallback(@RequestBody Map<String, Object> payload) {
        return ApiResponse.ok(Map.of("accepted", true, "idempotent", true, "paymentMode", "WECHAT_REAL_RESERVED"));
    }

    @PostMapping("/api/app/payments/wechat/cloud-callback")
    public ApiResponse<Map<String, Object>> cloudPaymentCallback(@RequestBody Map<String, Object> payload) {
        return ApiResponse.ok(Map.of("accepted", true, "idempotent", true, "paymentMode", "WECHAT_CLOUDPAY_RESERVED"));
    }

    @PostMapping("/api/app/payments/mock-success")
    public ApiResponse<Map<String, Object>> mockSuccess(@RequestBody(required = false) Map<String, Object> payload) {
        return ApiResponse.ok(paymentAppService.mockSuccess(payload));
    }

    @PostMapping("/api/app/payments/refund/callback")
    public ApiResponse<Map<String, Object>> refundCallback(@RequestBody Map<String, Object> payload) {
        return ApiResponse.ok(Map.of("accepted", true, "idempotent", true));
    }

    @GetMapping("/api/admin/payments")
    public ApiResponse<PageResponse<Map<String, Object>>> adminPayments() {
        return ApiResponse.ok(PageResponse.of(1, 20, paymentAppService.payments().size(), paymentAppService.payments()));
    }

    @GetMapping("/api/admin/payments/summary")
    public ApiResponse<Map<String, Object>> adminPaymentSummary() {
        return ApiResponse.ok(paymentAppService.summary());
    }
}
