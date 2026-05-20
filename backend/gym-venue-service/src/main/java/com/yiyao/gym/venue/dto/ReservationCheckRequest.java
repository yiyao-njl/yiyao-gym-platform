package com.yiyao.gym.venue.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record ReservationCheckRequest(String venueId, LocalDate bizDate, LocalTime startTime, LocalTime endTime) {
}
