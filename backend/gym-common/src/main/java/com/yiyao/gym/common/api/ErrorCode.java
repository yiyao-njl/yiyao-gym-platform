package com.yiyao.gym.common.api;

public enum ErrorCode {
    SUCCESS("请求成功"),
    UNAUTHORIZED("未登录或登录过期"),
    FORBIDDEN("无权限"),
    PARAM_INVALID("参数错误"),
    RESOURCE_NOT_FOUND("数据不存在"),
    BUSINESS_CONFLICT("业务冲突"),
    VENUE_UNAVAILABLE("场地不可用"),
    ORDER_EXPIRED("订单已过期"),
    PAYMENT_PROCESSING("支付处理中"),
    PAYMENT_FAILED("支付失败"),
    RATE_LIMITED("请求过于频繁"),
    SYSTEM_ERROR("系统异常");

    private final String message;

    ErrorCode(String message) {
        this.message = message;
    }

    public String message() {
        return message;
    }
}
