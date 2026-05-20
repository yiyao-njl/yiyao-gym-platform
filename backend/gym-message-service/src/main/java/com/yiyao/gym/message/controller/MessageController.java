package com.yiyao.gym.message.controller;

import com.yiyao.gym.common.api.ApiResponse;
import com.yiyao.gym.common.enums.MessageEventType;
import com.yiyao.gym.message.config.RabbitTopologyConfig;
import com.yiyao.gym.message.dto.MessageEvent;
import com.yiyao.gym.message.service.MessagePublishService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
public class MessageController {
    private final MessagePublishService messagePublishService;

    public MessageController(MessagePublishService messagePublishService) {
        this.messagePublishService = messagePublishService;
    }

    @PostMapping("/internal/messages/mock-payment-success")
    public ApiResponse<Map<String, Object>> mockPaymentSuccess() {
        MessageEvent event = new MessageEvent(UUID.randomUUID().toString(), MessageEventType.PAYMENT_SUCCESS, "YY202605170001", Instant.now(), Map.of("paymentNo", "PAY-DEMO"));
        messagePublishService.publish(RabbitTopologyConfig.PAYMENT_EXCHANGE, "payment.success", event);
        return ApiResponse.ok(Map.of("published", true, "eventId", event.eventId()));
    }
}
