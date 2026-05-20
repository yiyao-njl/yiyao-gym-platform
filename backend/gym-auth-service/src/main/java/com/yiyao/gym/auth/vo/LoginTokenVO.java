package com.yiyao.gym.auth.vo;

import java.util.List;

public record LoginTokenVO(
        String accessToken,
        String refreshToken,
        long expiresIn,
        String userType,
        String userId,
        List<String> roles,
        List<String> permissions
) {
}
