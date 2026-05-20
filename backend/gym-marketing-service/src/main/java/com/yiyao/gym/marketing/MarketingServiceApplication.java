package com.yiyao.gym.marketing;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.yiyao.gym")
public class MarketingServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(MarketingServiceApplication.class, args);
    }
}
