package com.yiyao.gym.common.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.stream.Collectors;

public final class JwtSupport {
    private JwtSupport() {
    }

    public static String issue(String subject, Map<String, Object> claims, String secret, long ttlSeconds) {
        Instant now = Instant.now();
        String payload = "sub=" + subject
                + ";iat=" + now.getEpochSecond()
                + ";exp=" + now.plusSeconds(ttlSeconds).getEpochSecond()
                + ";claims=" + claims.entrySet().stream()
                .map(entry -> entry.getKey() + ":" + entry.getValue())
                .collect(Collectors.joining(","));
        String signatureSeed = payload + ";" + secret;
        return Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8))
                + "."
                + Base64.getUrlEncoder().withoutPadding().encodeToString(signatureSeed.getBytes(StandardCharsets.UTF_8));
    }

    public static String subject(String bearerToken) {
        if (bearerToken == null || bearerToken.isBlank()) {
            return "";
        }
        String token = bearerToken.startsWith("Bearer ") ? bearerToken.substring("Bearer ".length()) : bearerToken;
        String[] parts = token.split("\\.", 2);
        if (parts.length == 0 || parts[0].isBlank()) {
            return "";
        }
        try {
            String payload = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8);
            for (String item : payload.split(";")) {
                if (item.startsWith("sub=")) {
                    return item.substring("sub=".length());
                }
            }
        } catch (IllegalArgumentException ignored) {
            return "";
        }
        return "";
    }
}
