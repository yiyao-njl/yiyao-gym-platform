package com.yiyao.gym.gateway.filter;

import com.yiyao.gym.common.api.ApiResponse;
import com.yiyao.gym.common.api.ErrorCode;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class AuthGatewayFilter implements GlobalFilter, Ordered {
    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final List<String> PUBLIC_PREFIXES = List.of(
            "/api/auth/",
            "/api/app/home",
            "/api/app/banners",
            "/api/app/activities",
            "/api/app/cities",
            "/api/app/stores",
            "/api/app/venues",
            "/actuator",
            "/swagger-ui",
            "/v3/api-docs"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        boolean isPublic = PUBLIC_PREFIXES.stream().anyMatch(path::startsWith);
        String auth = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (isPublic || (auth != null && auth.startsWith("Bearer "))) {
            return chain.filter(exchange);
        }
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        byte[] body = serializeUnauthorized();
        DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(body);
        return exchange.getResponse().writeWith(Mono.just(buffer));
    }

    private byte[] serializeUnauthorized() {
        try {
            return objectMapper.writeValueAsBytes(ApiResponse.fail(ErrorCode.UNAUTHORIZED, "Missing Bearer token"));
        } catch (JsonProcessingException ex) {
            return "{\"code\":\"UNAUTHORIZED\",\"message\":\"未登录或登录过期\"}".getBytes(StandardCharsets.UTF_8);
        }
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }
}
