package com.yiyao.gym.order.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record CreateOrderItemRequest(
        String cartItemId,
        String venueId,
        String venueName,
        String storeId,
        String packageId,
        LocalDate bizDate,
        LocalTime startTime,
        LocalTime endTime,
        Integer priceCent
) {
}
