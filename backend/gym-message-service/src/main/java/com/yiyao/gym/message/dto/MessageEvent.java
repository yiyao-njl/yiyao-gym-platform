package com.yiyao.gym.message.dto;

import com.yiyao.gym.common.enums.MessageEventType;

import java.time.Instant;
import java.util.Map;

public record MessageEvent(String eventId, MessageEventType eventType, String bizNo, Instant occurredAt, Map<String, Object> payload) {
}
