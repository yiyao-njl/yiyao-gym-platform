package com.yiyao.gym.marketing.service;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class MarketingService {
    public List<Map<String, Object>> activities() {
        return List.of(Map.of("activityId", "act-001", "title", "周末篮球热身季", "status", "ONLINE"));
    }

    public List<Map<String, Object>> coupons() {
        return List.of(Map.of("couponId", "coupon-001", "title", "满99减20", "amountCent", 2000, "thresholdCent", 9900, "status", "CLAIMABLE"));
    }
}
