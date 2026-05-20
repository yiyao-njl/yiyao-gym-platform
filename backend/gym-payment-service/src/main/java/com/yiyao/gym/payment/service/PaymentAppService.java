package com.yiyao.gym.payment.service;

import com.yiyao.gym.common.data.CommercialDataRepository;
import com.yiyao.gym.common.enums.PaymentStatus;
import com.yiyao.gym.payment.dto.CreatePaymentRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

@Service
public class PaymentAppService {
    private final CommercialDataRepository repository;

    public PaymentAppService(CommercialDataRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> create(CreatePaymentRequest request) {
        Map<String, Object> payment = repository.createPayment(request.orderNo());
        payment.put("paymentMode", "MOCK");
        payment.put("mockPayParams", Map.of("timeStamp", String.valueOf(Instant.now().getEpochSecond())));
        payment.put("wechatCloudPay", Map.of("enabled", false, "functionName", "createWechatPayOrder"));
        payment.put("wechatRealPay", Map.of("enabled", false, "configRequired", true));
        return payment;
    }

    public Map<String, Object> status(String paymentNo) {
        Map<String, Object> payment = repository.payment(paymentNo);
        return payment.isEmpty() ? Map.of("paymentNo", paymentNo, "paymentStatus", PaymentStatus.PAYING.name(), "polling", true) : payment;
    }

    public Map<String, Object> mockSuccess(Map<String, Object> payload) {
        return repository.mockPaymentSuccess(
                payload == null || payload.get("orderNo") == null ? "" : String.valueOf(payload.get("orderNo")),
                payload == null || payload.get("paymentNo") == null ? "" : String.valueOf(payload.get("paymentNo"))
        );
    }

    public java.util.List<Map<String, Object>> payments() {
        return repository.payments();
    }

    public Map<String, Object> summary() {
        return repository.paymentSummary();
    }
}
