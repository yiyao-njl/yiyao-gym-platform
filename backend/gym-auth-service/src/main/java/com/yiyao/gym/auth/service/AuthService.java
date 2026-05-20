package com.yiyao.gym.auth.service;

import com.yiyao.gym.auth.dto.AdminLoginRequest;
import com.yiyao.gym.auth.dto.WechatLoginRequest;
import com.yiyao.gym.auth.vo.LoginTokenVO;
import com.yiyao.gym.common.api.ErrorCode;
import com.yiyao.gym.common.data.CommercialDataRepository;
import com.yiyao.gym.common.exception.BizException;
import com.yiyao.gym.common.security.JwtSupport;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
public class AuthService {
    private static final String DEV_SECRET = "dev-only-secret-please-replace-with-env-value-32";
    private static final Map<String, SmsCodeRecord> SMS_CODES = new ConcurrentHashMap<>();
    private final CommercialDataRepository repository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final StringRedisTemplate redisTemplate;

    public AuthService(CommercialDataRepository repository, StringRedisTemplate redisTemplate) {
        this.repository = repository;
        this.redisTemplate = redisTemplate;
    }

    public LoginTokenVO wechatLogin(WechatLoginRequest request) {
        String loginCode = firstNonBlank(request == null ? null : request.loginCode(), request == null ? null : request.code(), "dev-login");
        Map<String, Object> user = repository.upsertWechatUser(
                loginCode,
                request == null ? "" : request.phoneCode(),
                request == null ? "" : request.nickname(),
                request == null ? "" : request.avatar()
        );
        String userId = String.valueOf(user.get("userId"));
        String token = JwtSupport.issue(userId, Map.of("type", "APP_USER"), DEV_SECRET, 7200);
        return new LoginTokenVO(token, "refresh-" + userId, 7200, "APP_USER", userId, List.of("USER"), List.of());
    }

    public LoginTokenVO adminLogin(AdminLoginRequest request) {
        String account = request == null || request.account() == null ? "admin" : request.account().trim();
        Map<String, Object> admin = repository.adminByAccount(account);
        if (admin.isEmpty()) {
            throw new BizException(ErrorCode.UNAUTHORIZED, "账号或密码错误");
        }
        String passwordHash = String.valueOf(admin.get("passwordHash"));
        String password = request == null ? "" : firstNonBlank(request.password(), "");
        if (!matchesPassword(password, passwordHash)) {
            throw new BizException(ErrorCode.UNAUTHORIZED, "账号或密码错误");
        }
        String role = String.valueOf(admin.get("roleCode"));
        String adminId = String.valueOf(admin.get("id"));
        String token = JwtSupport.issue(adminId, Map.of("type", "ADMIN", "role", role, "account", account), DEV_SECRET, 7200);
        return new LoginTokenVO(token, "refresh-admin-" + adminId, 7200, "ADMIN", adminId, List.of(role), permissions(role));
    }

    public Map<String, Object> sendSms(Map<String, Object> request) {
        String phone = string(request == null ? null : request.get("phone"), "");
        if (!phone.matches("^1\\d{10}$")) {
            throw new BizException(ErrorCode.PARAM_INVALID, "请输入正确的手机号");
        }
        SmsCodeRecord previous = SMS_CODES.get(phone);
        long now = System.currentTimeMillis();
        if (previous != null && now - previous.sentAtMillis() < 60_000) {
            throw new BizException(ErrorCode.PARAM_INVALID, "验证码发送过于频繁，请稍后再试");
        }
        SMS_CODES.put(phone, new SmsCodeRecord("123456", now, now + 5 * 60_000, 0));
        redisTemplate.opsForValue().set("gym:sms:" + phone, "123456", 5, TimeUnit.MINUTES);
        return repository.map("phone", phone, "sent", true, "smsMode", "MOCK", "mockCode", "123456", "expiresIn", 300);
    }

    public LoginTokenVO smsLogin(Map<String, Object> request) {
        String phone = string(request == null ? null : request.get("phone"), "");
        String code = string(request == null ? null : request.get("code"), "");
        String redisCode = redisTemplate.opsForValue().get("gym:sms:" + phone);
        SmsCodeRecord record = SMS_CODES.get(phone);
        if ((redisCode == null || redisCode.isBlank()) && (record == null || System.currentTimeMillis() > record.expiresAtMillis())) {
            throw new BizException(ErrorCode.UNAUTHORIZED, "验证码已过期，请重新获取");
        }
        String expected = redisCode == null || redisCode.isBlank() ? record.code() : redisCode;
        if (!expected.equals(code)) {
            if (record != null) {
                SMS_CODES.put(phone, new SmsCodeRecord(record.code(), record.sentAtMillis(), record.expiresAtMillis(), record.failures() + 1));
            }
            throw new BizException(ErrorCode.UNAUTHORIZED, "验证码错误");
        }
        Map<String, Object> user = repository.upsertWechatUser("sms-" + phone, "sms-" + phone, "手机号用户", "");
        String userId = String.valueOf(user.get("userId"));
        String token = JwtSupport.issue(userId, Map.of("type", "APP_USER", "phone", phone), DEV_SECRET, 7200);
        return new LoginTokenVO(token, "refresh-sms-" + userId, 7200, "APP_USER", userId, List.of("USER"), List.of());
    }

    public LoginTokenVO refresh() {
        String token = JwtSupport.issue("refresh-user", Map.of("type", "APP_USER"), DEV_SECRET, 7200);
        return new LoginTokenVO(token, "refresh-demo", 7200, "APP_USER", "refresh-user", List.of("USER"), List.of());
    }

    private record SmsCodeRecord(String code, long sentAtMillis, long expiresAtMillis, int failures) {
    }

    private boolean matchesPassword(String raw, String hash) {
        if (hash != null && hash.startsWith("$2")) {
            try {
                return passwordEncoder.matches(raw, hash);
            } catch (IllegalArgumentException ignored) {
                return "admin123".equals(raw) && hash.contains("demo");
            }
        }
        return "admin123".equals(raw) && (hash == null || hash.isBlank() || hash.contains("demo"));
    }

    private List<String> permissions(String role) {
        if ("STAFF".equals(role)) return List.of("orders", "payments", "reviews");
        if ("MANAGER".equals(role)) return List.of("dashboard", "stores", "venues", "orders", "payments", "users", "marketing", "reviews", "statistics");
        return List.of("dashboard", "stores", "venues", "orders", "payments", "users", "marketing", "reviews", "statistics", "system");
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) return value;
        }
        return "";
    }

    private String string(Object value, String fallback) {
        return value == null || String.valueOf(value).isBlank() ? fallback : String.valueOf(value);
    }
}
