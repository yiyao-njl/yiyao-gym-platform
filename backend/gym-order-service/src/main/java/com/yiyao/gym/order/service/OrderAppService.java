package com.yiyao.gym.order.service;

import com.yiyao.gym.common.api.ErrorCode;
import com.yiyao.gym.common.data.CommercialDataRepository;
import com.yiyao.gym.common.exception.BizException;
import com.yiyao.gym.order.dto.AddCartItemRequest;
import com.yiyao.gym.order.dto.CreateOrderItemRequest;
import com.yiyao.gym.order.dto.CreateOrderRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class OrderAppService {
    private final CommercialDataRepository repository;
    private final StringRedisTemplate redisTemplate;

    public OrderAppService(CommercialDataRepository repository, StringRedisTemplate redisTemplate) {
        this.repository = repository;
        this.redisTemplate = redisTemplate;
    }

    public Map<String, Object> addCartItem(AddCartItemRequest request) {
        return Map.of("cartItemId", "cart-" + Instant.now().toEpochMilli(), "checked", true, "venueId", request.venueId());
    }

    public List<Map<String, Object>> cartItems() {
        return List.of(Map.of("cartItemId", "cart-001", "venueId", "venue-001", "venueName", "1号篮球场", "priceCent", 9900, "checked", true));
    }

    public Map<String, Object> createOrder(CreateOrderRequest request) {
        return createOrder("app-user-001", request);
    }

    public Map<String, Object> createOrder(String userId, CreateOrderRequest request) {
        List<CreateOrderItemRequest> items = normalizeItems(request);
        items.forEach(this::validateOrderItem);
        List<String> lockKeys = items.stream()
                .map(item -> "gym:venue:lock:" + item.venueId() + ":" + item.bizDate() + ":" + item.startTime() + ":" + item.endTime())
                .toList();
        List<String> acquired = new ArrayList<>();
        try {
            for (String key : lockKeys) {
                Boolean ok = redisTemplate.opsForValue().setIfAbsent(key, "locked", 20, TimeUnit.SECONDS);
                if (!Boolean.TRUE.equals(ok)) {
                    throw new BizException(ErrorCode.VENUE_UNAVAILABLE, "场地正在被其他用户锁定，请稍后重试");
                }
                acquired.add(key);
            }
            List<Map<String, Object>> rawItems = items.stream()
                    .map(item -> repository.map(
                            "cartItemId", item.cartItemId() == null ? "" : item.cartItemId(),
                            "venueId", item.venueId(),
                            "venueName", item.venueName(),
                            "storeId", item.storeId(),
                            "packageId", item.packageId(),
                            "bizDate", item.bizDate().toString(),
                            "startTime", item.startTime().toString(),
                            "endTime", item.endTime().toString(),
                            "priceCent", item.priceCent() == null ? 0 : item.priceCent()
                    ))
                    .toList();
            return repository.createOrder(blankTo(userId, "app-user-001"), request.orderType(), rawItems);
        } finally {
            acquired.forEach(redisTemplate::delete);
        }
    }

    public List<Map<String, Object>> orders() {
        return repository.orders();
    }

    public Map<String, Object> order(String orderId) {
        return repository.order(orderId);
    }

    public Map<String, Object> cancel(String orderId) {
        return repository.cancelOrder(orderId);
    }

    public Map<String, Object> refund(String orderId, String reason) {
        return repository.applyRefund(orderId, reason);
    }

    public Map<String, Object> auditRefund(String refundId, boolean approved, String remark) {
        return repository.auditRefund(refundId, approved, remark);
    }

    public Map<String, Object> arrive(String orderId) {
        return repository.arriveOrder(orderId);
    }

    public Map<String, Object> confirmArrival(String orderId) {
        return repository.confirmArrival("app-user-001", orderId);
    }

    private List<CreateOrderItemRequest> normalizeItems(CreateOrderRequest request) {
        if (request.items() != null && !request.items().isEmpty()) {
            return request.items();
        }
        return List.of(new CreateOrderItemRequest(
                "cart-001",
                "venue-001",
                "1号篮球场",
                "store-001",
                "pkg-001",
                LocalDate.now().plusDays(1),
                LocalTime.of(10, 0),
                LocalTime.of(11, 0),
                7900
        ));
    }

    private void validateOrderItem(CreateOrderItemRequest item) {
        if (item.venueId() == null || item.bizDate() == null || item.startTime() == null || item.endTime() == null) {
            throw new BizException(ErrorCode.PARAM_INVALID, "场地和时间不能为空");
        }
        if (!item.endTime().isAfter(item.startTime())) {
            throw new BizException(ErrorCode.PARAM_INVALID, "结束时间必须晚于开始时间");
        }
    }

    private String blankTo(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}