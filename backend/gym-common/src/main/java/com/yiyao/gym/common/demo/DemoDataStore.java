package com.yiyao.gym.common.demo;

import com.yiyao.gym.common.api.ErrorCode;
import com.yiyao.gym.common.enums.OrderStatus;
import com.yiyao.gym.common.enums.PaymentStatus;
import com.yiyao.gym.common.enums.VenueOccupyStatus;
import com.yiyao.gym.common.exception.BizException;
import com.yiyao.gym.common.venue.VenueScheduleMemory;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

public final class DemoDataStore {
    private static final List<Map<String, Object>> ORDERS = new CopyOnWriteArrayList<>();
    private static final List<Map<String, Object>> PAYMENTS = new CopyOnWriteArrayList<>();
    private static final List<Map<String, Object>> REVIEWS = new CopyOnWriteArrayList<>();
    private static final List<Map<String, Object>> LOGS = new CopyOnWriteArrayList<>();

    private DemoDataStore() {
    }

    public static List<Map<String, Object>> cities() {
        return List.of(
                map("cityCode", "SZ", "name", "深圳", "hot", true, "letter", "S"),
                map("cityCode", "GZ", "name", "广州", "hot", true, "letter", "G")
        );
    }

    public static List<Map<String, Object>> stores() {
        return List.of(
                map("id", "store-001", "storeId", "store-001", "name", "伊幺体育中心店", "city", "深圳", "address", "南山区科技园运动路18号", "phone", "0755-88886666", "status", "营业中", "businessStatus", "OPEN", "hours", "09:00-24:00", "manager", "陈店长", "distance", "1.2km"),
                map("id", "store-002", "storeId", "store-002", "name", "伊幺体育龙华馆", "city", "深圳", "address", "龙华区民治大道66号", "phone", "0755-88668888", "status", "营业中", "businessStatus", "OPEN", "hours", "10:00-02:00", "manager", "李店长", "distance", "5.6km"),
                map("id", "store-003", "storeId", "store-003", "name", "伊幺体育天河馆", "city", "广州", "address", "天河区体育西路99号", "phone", "020-86669999", "status", "休息中", "businessStatus", "RESTING", "hours", "08:00-23:00", "manager", "吴店长", "distance", "18km")
        );
    }

    public static List<Map<String, Object>> venues() {
        return List.of(
                map("id", "venue-001", "venueId", "venue-001", "code", "A1", "name", "A1 全场篮球馆", "sport", "篮球", "storeId", "store-001", "store", "伊幺体育中心店", "price", 88, "basePriceCent", 8800, "status", "空闲", "capacity", 12, "bookable", "09:00-24:00"),
                map("id", "venue-002", "venueId", "venue-002", "code", "B2", "name", "B2 羽毛球场", "sport", "羽毛球", "storeId", "store-001", "store", "伊幺体育中心店", "price", 36, "basePriceCent", 3600, "status", "使用中", "capacity", 4, "bookable", "09:00-24:00"),
                map("id", "venue-003", "venueId", "venue-003", "code", "C3", "name", "C3 气排球场", "sport", "气排球", "storeId", "store-001", "store", "伊幺体育中心店", "price", 58, "basePriceCent", 5800, "status", "已预定", "capacity", 10, "bookable", "10:00-22:00"),
                map("id", "venue-004", "venueId", "venue-004", "code", "D1", "name", "D1 乒乓球台", "sport", "乒乓球", "storeId", "store-002", "store", "伊幺体育龙华馆", "price", 28, "basePriceCent", 2800, "status", "维护中", "capacity", 2, "bookable", "10:00-02:00"),
                map("id", "venue-005", "venueId", "venue-005", "code", "P1", "name", "P1 匹克球场", "sport", "匹克球", "storeId", "store-002", "store", "伊幺体育龙华馆", "price", 48, "basePriceCent", 4800, "status", "空闲", "capacity", 4, "bookable", "10:00-02:00")
        );
    }

    public static List<Map<String, Object>> packages() {
        return List.of(
                map("id", "pkg-001", "packageId", "pkg-001", "name", "篮球单场 1 小时", "sport", "篮球", "duration", "60分钟", "originPrice", 98, "price", 88, "store", "中心店", "enabled", true),
                map("id", "pkg-002", "packageId", "pkg-002", "name", "篮球畅打 2 小时", "sport", "篮球", "duration", "120分钟", "originPrice", 176, "price", 158, "store", "中心店", "enabled", true),
                map("id", "pkg-003", "packageId", "pkg-003", "name", "羽毛球标准 1 小时", "sport", "羽毛球", "duration", "60分钟", "originPrice", 45, "price", 36, "store", "中心店", "enabled", true)
        );
    }

    public static List<Map<String, Object>> coupons() {
        return List.of(
                map("id", "C001", "couponId", "C001", "name", "满 99 减 20", "amount", 20, "threshold", 99, "scope", "全场馆通用", "total", 500, "used", 132, "status", "发放中", "valid", "2026-05-01 至 2026-06-30"),
                map("id", "C002", "couponId", "C002", "name", "羽毛球 8 折券", "amount", 12, "threshold", 30, "scope", "羽毛球项目", "total", 200, "used", 61, "status", "发放中", "valid", "2026-05-01 至 2026-05-31")
        );
    }

    public static List<Map<String, Object>> activities() {
        return List.of(
                map("id", "A001", "activityId", "A001", "title", "周末篮球拼场季", "type", "满减活动", "store", "中心店", "time", "2026-05-16 至 2026-06-30", "status", "上架", "visits", 4280),
                map("id", "A002", "activityId", "A002", "title", "会员日双倍伊幺币", "type", "会员活动", "store", "全部门店", "time", "每周三", "status", "上架", "visits", 3180)
        );
    }

    public static List<Map<String, Object>> users() {
        return List.of(
                map("id", "U001", "userId", "app-user-001", "nickname", "小林", "phone", "13812345678", "level", "LV.3 运动达人", "points", 2680, "coupons", 3, "status", "正常", "registeredAt", "2026-04-08"),
                map("id", "U002", "userId", "app-user-002", "nickname", "阿杰", "phone", "13612345678", "level", "LV.2 活力先锋", "points", 980, "coupons", 1, "status", "正常", "registeredAt", "2026-04-12")
        );
    }

    public static List<Map<String, Object>> members() {
        return List.of(
                map("levelCode", "LV1", "name", "运动新星", "discountRate", 100, "benefits", "新人体验券、基础预约提醒、会员日经验累计", "minPoints", 0),
                map("levelCode", "LV2", "name", "活力先锋", "discountRate", 95, "benefits", "预约优先提醒、会员日双倍经验、活动优先报名", "minPoints", 800),
                map("levelCode", "LV3", "name", "运动达人", "discountRate", 90, "benefits", "专属场地券、预约提醒增强、活动名额优先、会员日双倍经验", "minPoints", 2000)
        );
    }

    public static List<Map<String, Object>> orders() {
        ensureSeedOrders();
        return ORDERS.stream().map(DemoDataStore::withRuntimeStatus).toList();
    }

    public static List<Map<String, Object>> payments() {
        ensureSeedOrders();
        return List.copyOf(PAYMENTS);
    }

    public static List<Map<String, Object>> reviews() {
        if (REVIEWS.isEmpty()) {
            REVIEWS.add(map("id", "R001", "reviewId", "R001", "user", "小林", "venue", "A1 全场篮球馆", "orderId", "O202605150009", "rating", 5, "content", "场地很新，灯光舒服。", "status", "已展示", "submittedAt", "2026-05-16 20:12", "reply", "感谢支持，欢迎再来。"));
            REVIEWS.add(map("id", "R002", "reviewId", "R002", "user", "阿杰", "venue", "B2 羽毛球场", "orderId", "O202605160012", "rating", 4, "content", "整体不错，高峰期人有点多。", "status", "待审核", "submittedAt", "2026-05-17 14:31", "reply", ""));
        }
        return List.copyOf(REVIEWS);
    }

    public static List<Map<String, Object>> logs() {
        if (LOGS.isEmpty()) {
            LOGS.add(map("id", "L001", "operator", "农佳磊", "module", "订单管理", "action", "确认到场", "ip", "127.0.0.1", "time", "2026-05-18 10:52"));
            LOGS.add(map("id", "L002", "operator", "陈店长", "module", "场地管理", "action", "将 D1 设为维护中", "ip", "127.0.0.1", "time", "2026-05-18 09:44"));
        }
        return List.copyOf(LOGS);
    }

    public static Map<String, Object> createOrder(String orderType, List<Map<String, Object>> rawItems) {
        ensureSeedOrders();
        List<Map<String, Object>> items = rawItems == null || rawItems.isEmpty() ? defaultOrderItems() : rawItems;
        String normalizedType = normalizeOrderType(orderType);
        String orderId = "O" + Instant.now().toEpochMilli();
        String orderNo = "YY" + Instant.now().toEpochMilli();
        VenueOccupyStatus occupyStatus = "WALK_IN".equals(normalizedType) ? VenueOccupyStatus.USING : VenueOccupyStatus.BOOKED;
        int amountCent = 0;
        List<Map<String, Object>> orderItems = new ArrayList<>();
        for (Map<String, Object> item : items) {
            String venueId = string(item.get("venueId"), "venue-001");
            LocalDate bizDate = LocalDate.parse(string(item.get("bizDate"), LocalDate.now().plusDays(1).toString()));
            LocalTime startTime = parseTime(string(item.get("startTime"), "10:00:00"));
            LocalTime endTime = parseTime(string(item.get("endTime"), "11:00:00"));
            if (!VenueScheduleMemory.isAvailable(venueId, bizDate, startTime, endTime)) {
                throw new BizException(ErrorCode.VENUE_UNAVAILABLE, "场地时段已被占用，请重新选择");
            }
        }
        for (Map<String, Object> item : items) {
            String venueId = string(item.get("venueId"), "venue-001");
            LocalDate bizDate = LocalDate.parse(string(item.get("bizDate"), LocalDate.now().plusDays(1).toString()));
            LocalTime startTime = parseTime(string(item.get("startTime"), "10:00:00"));
            LocalTime endTime = parseTime(string(item.get("endTime"), "11:00:00"));
            int priceCent = number(item.get("priceCent"), 8800);
            amountCent += priceCent;
            VenueScheduleMemory.occupy(orderId, venueId, bizDate, startTime, endTime, occupyStatus);
            orderItems.add(map(
                    "cartItemId", string(item.get("cartItemId"), ""),
                    "venueId", venueId,
                    "venueName", string(item.get("venueName"), findVenueName(venueId)),
                    "storeId", string(item.get("storeId"), "store-001"),
                    "packageId", string(item.get("packageId"), ""),
                    "bizDate", bizDate.toString(),
                    "startTime", startTime.toString(),
                    "endTime", endTime.toString(),
                    "occupyStatus", occupyStatus.name(),
                    "priceCent", priceCent
            ));
        }
        Map<String, Object> order = map(
                "id", orderId,
                "orderId", orderId,
                "orderNo", orderNo,
                "type", "WALK_IN".equals(normalizedType) ? "开场订单" : "预约订单",
                "orderType", normalizedType,
                "user", "小林",
                "phone", "13812345678",
                "store", "伊幺体育中心店",
                "venue", string(orderItems.get(0).get("venueName"), "A1 全场篮球馆"),
                "time", orderItems.get(0).get("bizDate") + " " + orderItems.get(0).get("startTime") + "-" + orderItems.get(0).get("endTime"),
                "amount", amountCent / 100.0,
                "payAmountCent", amountCent,
                "payStatus", "已支付",
                "paymentStatus", PaymentStatus.PAID.name(),
                "orderStatus", "WALK_IN".equals(normalizedType) ? OrderStatus.IN_USE.name() : OrderStatus.PAID.name(),
                "useStatus", "WALK_IN".equals(normalizedType) ? "IN_USE" : "RESERVED",
                "createdAt", LocalDateTime.now().toString(),
                "items", orderItems
        );
        ORDERS.add(0, order);
        String paymentNo = "P" + Instant.now().toEpochMilli();
        PAYMENTS.add(0, map("paymentNo", paymentNo, "orderId", orderId, "orderNo", orderNo, "amount", amountCent / 100.0, "amountCent", amountCent, "method", "模拟支付", "payStatus", "成功", "paymentStatus", PaymentStatus.PAID.name(), "refundStatus", "无退款", "paidAt", LocalDateTime.now().toString(), "callback", "MOCK_SUCCESS"));
        return withRuntimeStatus(order);
    }

    public static Map<String, Object> mockPaymentSuccess(String orderNo, String paymentNo) {
        ensureSeedOrders();
        String nextPaymentNo = paymentNo == null || paymentNo.isBlank() ? "P" + Instant.now().toEpochMilli() : paymentNo;
        Map<String, Object> payment = map("paymentNo", nextPaymentNo, "orderNo", string(orderNo, ""), "amount", 88, "amountCent", 8800, "method", "模拟支付", "payStatus", "成功", "paymentStatus", PaymentStatus.PAID.name(), "refundStatus", "无退款", "paidAt", LocalDateTime.now().toString(), "callback", "MOCK_SUCCESS");
        PAYMENTS.add(0, payment);
        return payment;
    }

    public static Map<String, Object> dashboard() {
        ensureSeedOrders();
        return map(
                "revenueCent", PAYMENTS.stream().mapToInt(item -> number(item.get("amountCent"), 0)).sum(),
                "orderCount", ORDERS.size(),
                "reservationCount", ORDERS.stream().filter(item -> "预约订单".equals(item.get("type"))).count(),
                "walkInCount", ORDERS.stream().filter(item -> "开场订单".equals(item.get("type"))).count(),
                "pendingRefundCount", 1,
                "pendingReviewCount", reviews().stream().filter(item -> "待审核".equals(item.get("status"))).count(),
                "venueUsageRate", 0.73,
                "memberGrowth", 8,
                "trends", List.of(map("date", "2026-05-16", "revenueCent", 489000, "orders", 56), map("date", "2026-05-17", "revenueCent", 526000, "orders", 61), map("date", "2026-05-18", "revenueCent", 438000, "orders", 49)),
                "latestOrders", orders().stream().limit(5).toList(),
                "venueRanking", List.of(map("name", "篮球", "value", 36), map("name", "羽毛球", "value", 28), map("name", "气排球", "value", 16))
        );
    }

    public static Map<String, Object> adminMe() {
        return map("name", "农佳磊", "account", "admin", "role", "超级管理员", "store", "全部门店", "phone", "13800000000", "lastLoginAt", LocalDateTime.now().toString(), "permissions", List.of("dashboard", "stores", "venues", "orders", "payments", "users", "marketing", "reviews", "statistics", "system"));
    }

    public static Map<String, Object> map(Object... values) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (int i = 0; i + 1 < values.length; i += 2) {
            result.put(String.valueOf(values[i]), values[i + 1]);
        }
        return result;
    }

    public static String string(Object value, String fallback) {
        return value == null || String.valueOf(value).isBlank() ? fallback : String.valueOf(value);
    }

    public static int number(Object value, int fallback) {
        if (value instanceof Number number) return number.intValue();
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (Exception ex) {
            return fallback;
        }
    }

    private static void ensureSeedOrders() {
        if (!ORDERS.isEmpty()) return;
        ORDERS.add(map("id", "O202605180001", "orderId", "O202605180001", "orderNo", "YY202605180001", "type", "预约订单", "orderType", "RESERVATION", "user", "小林", "phone", "13812345678", "store", "伊幺体育中心店", "venue", "A1 全场篮球馆", "time", "2026-05-18 19:00-21:00", "amount", 158, "payAmountCent", 15800, "payStatus", "已支付", "paymentStatus", PaymentStatus.PAID.name(), "orderStatus", "待到场", "useStatus", "RESERVED", "createdAt", "2026-05-18 10:12", "items", defaultOrderItems()));
        ORDERS.add(map("id", "O202605180002", "orderId", "O202605180002", "orderNo", "YY202605180002", "type", "开场订单", "orderType", "WALK_IN", "user", "阿杰", "phone", "13612345678", "store", "伊幺体育中心店", "venue", "B2 羽毛球场", "time", "2026-05-18 11:00-12:00", "amount", 36, "payAmountCent", 3600, "payStatus", "已支付", "paymentStatus", PaymentStatus.PAID.name(), "orderStatus", "使用中", "useStatus", "IN_USE", "createdAt", "2026-05-18 10:48", "items", defaultOrderItems()));
        PAYMENTS.add(map("paymentNo", "P202605180001", "orderId", "O202605180001", "orderNo", "YY202605180001", "amount", 158, "amountCent", 15800, "method", "微信支付", "payStatus", "成功", "paymentStatus", PaymentStatus.PAID.name(), "refundStatus", "无退款", "paidAt", "2026-05-18 10:13", "callback", "SUCCESS"));
        PAYMENTS.add(map("paymentNo", "P202605180002", "orderId", "O202605180002", "orderNo", "YY202605180002", "amount", 36, "amountCent", 3600, "method", "微信支付", "payStatus", "成功", "paymentStatus", PaymentStatus.PAID.name(), "refundStatus", "无退款", "paidAt", "2026-05-18 10:49", "callback", "SUCCESS"));
    }

    private static List<Map<String, Object>> defaultOrderItems() {
        return List.of(map("cartItemId", "cart-001", "venueId", "venue-001", "venueName", "A1 全场篮球馆", "storeId", "store-001", "packageId", "pkg-001", "bizDate", LocalDate.now().plusDays(1).toString(), "startTime", "10:00:00", "endTime", "11:00:00", "priceCent", 8800));
    }

    private static String normalizeOrderType(String value) {
        String raw = value == null ? "RESERVATION" : value.trim().toUpperCase();
        if ("WALKIN".equals(raw)) return "WALK_IN";
        if ("WALK_IN".equals(raw) || "RESERVATION".equals(raw)) return raw;
        return "RESERVATION";
    }

    private static LocalTime parseTime(String value) {
        return value.length() == 5 ? LocalTime.parse(value + ":00") : LocalTime.parse(value);
    }

    private static String findVenueName(String venueId) {
        return venues().stream().filter(item -> venueId.equals(item.get("venueId"))).findFirst().map(item -> string(item.get("name"), venueId)).orElse(venueId);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> withRuntimeStatus(Map<String, Object> order) {
        if (!"RESERVED".equals(order.get("useStatus"))) return order;
        List<Map<String, Object>> items = (List<Map<String, Object>>) order.get("items");
        if (items == null || items.isEmpty()) return order;
        Map<String, Object> first = items.get(0);
        LocalDate date = LocalDate.parse(string(first.get("bizDate"), LocalDate.now().toString()));
        LocalTime start = parseTime(string(first.get("startTime"), "10:00:00"));
        if (LocalDateTime.of(date, start).isAfter(LocalDateTime.now())) return order;
        Map<String, Object> next = new LinkedHashMap<>(order);
        next.put("useStatus", "IN_USE");
        next.put("orderStatus", OrderStatus.IN_USE.name());
        next.put("type", "开场订单");
        return next;
    }
}
