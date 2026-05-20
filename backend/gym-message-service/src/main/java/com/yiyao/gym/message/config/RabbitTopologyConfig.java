package com.yiyao.gym.message.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitTopologyConfig {
    public static final String ORDER_EXCHANGE = "gym.order.exchange";
    public static final String PAYMENT_EXCHANGE = "gym.payment.exchange";
    public static final String PAYMENT_SUCCESS_QUEUE = "order.payment.success.queue";
    public static final String ORDER_TIMEOUT_QUEUE = "order.timeout.close.queue";

    @Bean
    TopicExchange orderExchange() {
        return ExchangeBuilder.topicExchange(ORDER_EXCHANGE).durable(true).build();
    }

    @Bean
    TopicExchange paymentExchange() {
        return ExchangeBuilder.topicExchange(PAYMENT_EXCHANGE).durable(true).build();
    }

    @Bean
    Queue paymentSuccessQueue() {
        return QueueBuilder.durable(PAYMENT_SUCCESS_QUEUE).build();
    }

    @Bean
    Queue orderTimeoutQueue() {
        return QueueBuilder.durable(ORDER_TIMEOUT_QUEUE).build();
    }

    @Bean
    Binding paymentSuccessBinding() {
        return BindingBuilder.bind(paymentSuccessQueue()).to(paymentExchange()).with("payment.success");
    }

    @Bean
    Binding orderTimeoutBinding() {
        return BindingBuilder.bind(orderTimeoutQueue()).to(orderExchange()).with("order.closed.timeout");
    }
}
