package com.yiyao.gym.auth.dto;

public record WechatLoginRequest(
        String code,
        String loginCode,
        String phoneCode,
        String encryptedData,
        String iv,
        String nickname,
        String avatar,
        String scene,
        String clientType
) {
}
