package com.yiyao.gym.message.service;

import com.yiyao.gym.message.dto.MessageEvent;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
public class MessagePublishService {
    private final RabbitTemplate rabbitTemplate;

    public MessagePublishService(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publish(String exchange, String routingKey, MessageEvent event) {
        // TODO: Persist outbox event before publish for compensating RabbitMQ outages.
        rabbitTemplate.convertAndSend(exchange, routingKey, event);
    }
}
