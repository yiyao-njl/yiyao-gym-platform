package com.yiyao.gym.order.controller;

import com.yiyao.gym.common.api.ApiResponse;
import com.yiyao.gym.order.dto.AddCartItemRequest;
import com.yiyao.gym.order.service.OrderAppService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/app/cart")
public class CartController {
    private final OrderAppService orderAppService;

    public CartController(OrderAppService orderAppService) {
        this.orderAppService = orderAppService;
    }

    @PostMapping("/items")
    public ApiResponse<Map<String, Object>> add(@RequestBody AddCartItemRequest request) {
        return ApiResponse.ok(orderAppService.addCartItem(request));
    }

    @GetMapping("/items")
    public ApiResponse<List<Map<String, Object>>> items() {
        return ApiResponse.ok(orderAppService.cartItems());
    }

    @PatchMapping("/items/{itemId}/checked")
    public ApiResponse<Map<String, Object>> checked(@PathVariable String itemId) {
        return ApiResponse.ok(Map.of("cartItemId", itemId, "checked", true));
    }

    @DeleteMapping("/items/{itemId}")
    public ApiResponse<Map<String, Object>> delete(@PathVariable String itemId) {
        return ApiResponse.ok(Map.of("cartItemId", itemId, "deleted", true));
    }

    @PostMapping("/checkout-preview")
    public ApiResponse<Map<String, Object>> checkoutPreview() {
        return ApiResponse.ok(Map.of("available", true, "originAmountCent", 9900, "discountAmountCent", 2000, "payAmountCent", 7900));
    }
}
