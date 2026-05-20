package com.yiyao.gym.venue;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.yiyao.gym")
public class VenueServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(VenueServiceApplication.class, args);
    }
}
