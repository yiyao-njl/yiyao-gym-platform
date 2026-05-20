package com.yiyao.gym.order.dto;

import java.util.List;

public record CreateOrderRequest(String orderType, String couponId, List<String> cartItemIds, List<CreateOrderItemRequest> items) {
}
