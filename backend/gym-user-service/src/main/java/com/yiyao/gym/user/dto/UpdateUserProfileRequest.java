package com.yiyao.gym.user.dto;

public record UpdateUserProfileRequest(String nickname, String avatarFileId, String phone) {
}
