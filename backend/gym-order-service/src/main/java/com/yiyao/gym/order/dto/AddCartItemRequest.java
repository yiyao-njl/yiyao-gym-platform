package com.yiyao.gym.order.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record AddCartItemRequest(String venueId, String packageId, LocalDate bizDate, LocalTime startTime, LocalTime endTime) {
}
