package com.yiyao.gym.common.exception;

import com.yiyao.gym.common.api.ErrorCode;

public class BizException extends RuntimeException {
    private final ErrorCode code;

    public BizException(ErrorCode code, String message) {
        super(message);
        this.code = code;
    }

    public ErrorCode code() {
        return code;
    }
}
