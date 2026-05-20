package com.yiyao.gym.order.controller;

import com.yiyao.gym.common.api.ApiResponse;
import com.yiyao.gym.common.api.PageResponse;
import com.yiyao.gym.order.dto.CreateOrderRequest;
import com.yiyao.gym.order.service.OrderAppService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class OrderController {
    private final OrderAppService orderAppService;

    public OrderController(OrderAppService orderAppService) {
        this.orderAppService = orderAppService;
    }

    @PostMapping("/api/app/orders")
    public ApiResponse<Map<String, Object>> create(@RequestBody CreateOrderRequest request) {
        return ApiResponse.ok(orderAppService.createOrder(request));
    }

    @GetMapping({"/api/app/orders", "/api/admin/orders"})
    public ApiResponse<PageResponse<Map<String, Object>>> list() {
        return ApiResponse.ok(PageResponse.of(1, 10, orderAppService.orders().size(), orderAppService.orders()));
    }

    @GetMapping({"/api/app/orders/{orderId}", "/api/admin/orders/{orderId}"})
    public ApiResponse<Map<String, Object>> detail(@PathVariable String orderId) {
        return ApiResponse.ok(orderAppService.order(orderId));
    }

    @PostMapping({"/api/app/orders/{orderId}/cancel", "/api/admin/orders/{orderId}/cancel"})
    public ApiResponse<Map<String, Object>> cancel(@PathVariable String orderId) {
        return ApiResponse.ok(orderAppService.cancel(orderId));
    }

    @PostMapping({"/api/app/orders/{orderId}/refund", "/api/admin/orders/{orderId}/refund"})
    public ApiResponse<Map<String, Object>> refund(@PathVariable String orderId, @RequestBody(required = false) Map<String, Object> payload) {
        String reason = payload == null || payload.get("reason") == null ? "" : String.valueOf(payload.get("reason"));
        return ApiResponse.ok(orderAppService.refund(orderId, reason));
    }

    @PostMapping("/api/admin/refunds/{refundId}/audit")
    public ApiResponse<Map<String, Object>> auditRefund(@PathVariable String refundId, @RequestBody(required = false) Map<String, Object> payload) {
        String result = payload == null || payload.get("result") == null ? "同意退款" : String.valueOf(payload.get("result"));
        String remark = payload == null || payload.get("remark") == null ? "" : String.valueOf(payload.get("remark"));
        return ApiResponse.ok(orderAppService.auditRefund(refundId, !result.contains("拒绝"), remark));
    }

    @PostMapping("/api/admin/orders/{orderId}/arrive")
    public ApiResponse<Map<String, Object>> arrive(@PathVariable String orderId) {
        return ApiResponse.ok(orderAppService.arrive(orderId));
    }
}
