package com.yiyao.gym.common.data;

import com.yiyao.gym.common.api.ErrorCode;
import com.yiyao.gym.common.exception.BizException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Repository
public class CommercialDataRepository {
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Shanghai");

    private final JdbcTemplate jdbc;

    public CommercialDataRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> cities() {
        return jdbc.queryForList("""
                select city_code as cityCode, name, hot, letter
                from city
                order by hot desc, letter, name
                """);
    }

    public List<Map<String, Object>> stores() {
        return jdbc.queryForList("""
                select id, id as storeId, name, city, address, phone,
                       business_status as businessStatus,
                       case business_status when 'OPEN' then '营业中' when 'RESTING' then '休息中' else '停用' end as status,
                       business_hours as hours, manager, distance_text as distance, created_at as createdAt
                from gym_store
                order by created_at desc, id
                """);
    }

    public Map<String, Object> store(String storeId) {
        return singleOrEmpty("""
                select id, id as storeId, name, city, address, phone, business_status as businessStatus,
                       case business_status when 'OPEN' then '营业中' when 'RESTING' then '休息中' else '停用' end as status,
                       business_hours as hours, manager, distance_text as distance, created_at as createdAt
                from gym_store where id = ?
                """, storeId);
    }

    public List<Map<String, Object>> venues() {
        return jdbc.queryForList("""
                select v.id, v.id as venueId, v.code, v.name, v.sport, v.store_id as storeId, s.name as store,
                       v.capacity, v.status as statusCode,
                       case v.status when 'AVAILABLE' then '空闲' when 'IN_USE' then '使用中' when 'BOOKED' then '已预定' when 'MAINTENANCE' then '维护中' else v.status end as status,
                       v.base_price_cent / 100 as price, v.base_price_cent as basePriceCent,
                       v.bookable_time as bookable, v.image_url as image
                from venue v
                join gym_store s on s.id = v.store_id
                order by s.id, v.code
                """);
    }

    public Map<String, Object> venue(String venueId) {
        return singleOrEmpty("""
                select v.id, v.id as venueId, v.code, v.name, v.sport, v.store_id as storeId, s.name as store,
                       v.capacity, v.status as statusCode,
                       case v.status when 'AVAILABLE' then '空闲' when 'IN_USE' then '使用中' when 'BOOKED' then '已预定' when 'MAINTENANCE' then '维护中' else v.status end as status,
                       v.base_price_cent / 100 as price, v.base_price_cent as basePriceCent,
                       v.bookable_time as bookable, v.image_url as image
                from venue v
                join gym_store s on s.id = v.store_id
                where v.id = ?
                """, venueId);
    }

    @Transactional
    public Map<String, Object> updateStore(String storeId, Map<String, Object> payload) {
        Map<String, Object> current = store(storeId);
        if (current.isEmpty()) {
            throw new BizException(ErrorCode.RESOURCE_NOT_FOUND, "门店不存在");
        }
        String status = string(payload == null ? null : payload.get("status"), string(current.get("status"), "营业中"));
        String hours = string(payload == null ? null : payload.get("hours"), string(current.get("hours"), "09:00-23:59"));
        jdbc.update("""
                update gym_store
                set business_status = ?, business_hours = ?
                where id = ?
                """, storeStatusCode(status), hours, storeId);
        return store(storeId);
    }

    @Transactional
    public Map<String, Object> updateVenue(String venueId, Map<String, Object> payload) {
        Map<String, Object> current = venue(venueId);
        if (current.isEmpty()) {
            throw new BizException(ErrorCode.RESOURCE_NOT_FOUND, "场地不存在");
        }
        String status = string(payload == null ? null : payload.get("status"), string(current.get("status"), "空闲"));
        String bookable = string(payload == null ? null : payload.get("bookable"), string(current.get("bookable"), "09:00-23:59"));
        int priceCent = number(payload == null ? null : payload.get("basePriceCent"), number(current.get("basePriceCent"), 0));
        if (payload != null && payload.get("price") != null) {
            priceCent = (int) Math.round(Double.parseDouble(String.valueOf(payload.get("price"))) * 100);
        }
        jdbc.update("""
                update venue
                set status = ?, bookable_time = ?, base_price_cent = ?
                where id = ?
                """, venueStatusCode(status), bookable, priceCent, venueId);
        return venue(venueId);
    }

    public List<Map<String, Object>> venueTypes() {
        return jdbc.queryForList("""
                select distinct upper(replace(sport, ' ', '_')) as typeCode, sport as name
                from venue
                order by sport
                """);
    }

    public List<Map<String, Object>> packages() {
        return jdbc.queryForList("""
                select p.id, p.id as packageId, p.name, p.venue_sport as sport,
                       concat(p.duration_minutes, '分钟') as duration, p.duration_minutes as durationMinutes,
                       p.origin_price_cent / 100 as originPrice, p.price_cent / 100 as price,
                       p.origin_price_cent as originPriceCent, p.price_cent as priceCent,
                       true as enabled
                from venue_package p
                where p.enabled = 1
                order by p.venue_sport, p.duration_minutes
                """);
    }

    public List<Map<String, Object>> slots(String venueId, LocalDate bizDate) {
        return jdbc.queryForList("""
                select venue_id as venueId, biz_date as bizDate, start_time as startTime, end_time as endTime, occupy_status as status, order_id as orderId
                from venue_occupancy
                where venue_id = ? and biz_date = ? and occupy_status in ('BOOKED','USING')
                order by start_time
                """, venueId, bizDate);
    }

    public boolean isVenueAvailable(String venueId, LocalDate bizDate, LocalTime startTime, LocalTime endTime) {
        Integer count = jdbc.queryForObject("""
                select count(1)
                from venue_occupancy
                where venue_id = ? and biz_date = ? and occupy_status in ('BOOKED','USING')
                  and start_time < ? and end_time > ?
                """, Integer.class, venueId, bizDate, endTime, startTime);
        return count == null || count == 0;
    }

    public List<Map<String, Object>> activities() {
        return jdbc.queryForList("""
                select id, id as activityId, title, activity_type as type, store_scope as store, time_text as time,
                       status, visits, rules, image_url as image
                from activity
                order by created_at desc, id
                """);
    }

    public Map<String, Object> activity(String activityId) {
        return singleOrEmpty("""
                select id, id as activityId, title, activity_type as type, store_scope as store, time_text as time,
                       status, visits, rules, image_url as image
                from activity
                where id = ?
                """, activityId);
    }

    public List<Map<String, Object>> coupons() {
        return jdbc.queryForList("""
                select id, id as couponId, name, amount_cent / 100 as amount, threshold_cent / 100 as threshold,
                       amount_cent as amountCent, threshold_cent as thresholdCent,
                       scope, total_count as total, used_count as used, status, valid_text as valid
                from coupon_template
                order by created_at desc, id
                """);
    }

    public List<Map<String, Object>> members() {
        return jdbc.queryForList("""
                select level_code as levelCode, name, discount_rate as discountRate, benefits, min_points as minPoints
                from member_level
                order by min_points
                """);
    }

    @Transactional
    public List<Map<String, Object>> updateMemberLevels(List<Map<String, Object>> levels) {
        List<Map<String, Object>> sortedLevels = levels.stream()
                .sorted(Comparator.comparingInt(level -> number(level.get("minPoints"), 0)))
                .toList();
        for (Map<String, Object> level : sortedLevels) {
            jdbc.update("""
                    update member_level
                    set name = ?, discount_rate = ?, benefits = ?, min_points = ?
                    where level_code = ?
                    """,
                    string(level.get("name"), ""),
                    number(level.get("discountRate"), 100),
                    string(level.get("benefits"), ""),
                    number(level.get("minPoints"), 0),
                    string(level.get("levelCode"), ""));
        }
        return members();
    }

    public List<Map<String, Object>> users() {
        return jdbc.queryForList("""
                select id, id as userId, nickname, phone_masked as phone, level_name as level, points, coupons_count as coupons,
                       status, registered_at as registeredAt, avatar_url as avatar
                from user_profile
                order by registered_at desc
                """);
    }

    public Map<String, Object> userSummary() {
        int totalUsers = number(jdbc.queryForObject("select count(1) from user_profile", Integer.class), 0);
        int memberUsers = number(jdbc.queryForObject("""
                select count(1)
                from user_profile
                where points > 0 or level_name not like 'LV.1%'
                """, Integer.class), 0);
        int monthNewUsers = number(jdbc.queryForObject("""
                select count(1)
                from user_profile
                where registered_at >= date_format(current_date, '%Y-%m-01')
                """, Integer.class), 0);
        int abnormalUsers = number(jdbc.queryForObject("select count(1) from user_profile where status <> '正常'", Integer.class), 0);
        return map(
                "totalUsers", totalUsers,
                "memberUsers", memberUsers,
                "monthNewUsers", monthNewUsers,
                "abnormalUsers", abnormalUsers
        );
    }

    public Map<String, Object> userById(String userId) {
        Map<String, Object> user = singleOrEmpty("""
                select id, id as userId, nickname, phone_masked as phone, level_name as level, points, coupons_count as coupons,
                       status, registered_at as registeredAt, avatar_url as avatar
                from user_profile
                where id = ?
                """, userId);
        if (user.isEmpty()) {
            return users().stream().findFirst().orElse(Map.of());
        }
        return user;
    }

    public List<Map<String, Object>> points(String userId) {
        return jdbc.queryForList("""
                select id, month_text as month, created_at as time, title, value, remark
                from point_record
                where user_id = ?
                order by created_at desc
                """, userId);
    }

    @Transactional
    public Map<String, Object> upsertWechatUser(String loginCode, String phoneCode, String nickname, String avatar) {
        String openid = "dev-openid-" + safe(loginCode, phoneCode, "guest").hashCode();
        String phone = phoneFromCode(phoneCode == null || phoneCode.isBlank() ? loginCode : phoneCode);
        String masked = maskPhone(phone);
        String userId = jdbc.query("""
                select id from user_profile where openid = ? or phone = ? order by registered_at limit 1
                """, rs -> rs.next() ? rs.getString(1) : null, openid, phone);
        if (userId == null) {
            userId = "app-user-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
            jdbc.update("""
                    insert into user_profile(id, openid, phone, phone_masked, nickname, avatar_url, level_name, points, coupons_count, status, registered_at)
                    values(?,?,?,?,?,?,?,?,?,?,?)
                    """, userId, openid, phone, masked, blankTo(nickname, "微信用户"), blankTo(avatar, ""), "LV.1 运动新星", 0, 0, "正常", LocalDateTime.now());
        } else {
            jdbc.update("""
                    update user_profile set openid = ?, phone = ?, phone_masked = ?, nickname = coalesce(nullif(?, ''), nickname), avatar_url = coalesce(nullif(?, ''), avatar_url)
                    where id = ?
                    """, openid, phone, masked, blankTo(nickname, ""), blankTo(avatar, ""), userId);
        }
        return userById(userId);
    }

    public Map<String, Object> adminByAccount(String account) {
        return singleOrEmpty("""
                select id, account, password_hash as passwordHash, name, role_code as roleCode, store_id as storeId, status
                from admin_account
                where account = ?
                """, account);
    }

    public Map<String, Object> adminMe(String account) {
        Map<String, Object> admin = adminByAccount(blankTo(account, "admin"));
        if (admin.isEmpty()) {
            admin = adminByAccount("admin");
        }
        return map(
                "id", admin.get("id"),
                "name", admin.get("name"),
                "account", admin.get("account"),
                "role", roleName(String.valueOf(admin.get("roleCode"))),
                "roleCode", admin.get("roleCode"),
                "store", admin.get("storeId") == null ? "全部门店" : admin.get("storeId"),
                "permissions", permissions(String.valueOf(admin.get("roleCode")))
        );
    }

    public List<Map<String, Object>> adminAccounts() {
        return jdbc.queryForList("""
                select id, account, name, role_code as roleCode,
                       case role_code when 'SUPER_ADMIN' then '超级管理员' when 'MANAGER' then '店长' else '员工' end as role,
                       coalesce(store_id, '全部门店') as store, status
                from admin_account
                order by id
                """);
    }

    public List<Map<String, Object>> logs() {
        return jdbc.queryForList("""
                select id, operator, module_name as module, action_text as action, ip, created_at as time
                from operation_log
                order by created_at desc
                limit 100
                """);
    }

    @Transactional
    public Map<String, Object> createOrder(String userId, String orderType, List<Map<String, Object>> rawItems) {
        if (rawItems == null || rawItems.isEmpty()) {
            throw new BizException(ErrorCode.PARAM_INVALID, "订单明细不能为空");
        }
        String orderId = "order-" + System.currentTimeMillis();
        String orderNo = "YY" + System.currentTimeMillis();
        int amountCent = 0;
        List<Map<String, Object>> items = new ArrayList<>();
        for (Map<String, Object> raw : rawItems) {
            String venueId = string(raw.get("venueId"), "");
            LocalDate bizDate = LocalDate.parse(string(raw.get("bizDate"), LocalDate.now().toString()));
            LocalTime start = parseTime(raw.get("startTime"));
            LocalTime end = parseTime(raw.get("endTime"));
            Map<String, Object> venue = venue(venueId);
            if (venue.isEmpty()) {
                throw new BizException(ErrorCode.RESOURCE_NOT_FOUND, "场地不存在");
            }
            if (!isVenueAvailable(venueId, bizDate, start, end)) {
                throw new BizException(ErrorCode.VENUE_UNAVAILABLE, "场地时段已被占用，请重新选择");
            }
            int priceCent = number(venue.get("basePriceCent"), number(raw.get("priceCent"), 0));
            amountCent += priceCent;
            items.add(map("venueId", venueId, "venueName", venue.get("name"), "storeId", venue.get("storeId"),
                    "packageId", string(raw.get("packageId"), ""), "bizDate", bizDate, "startTime", start, "endTime", end, "priceCent", priceCent));
        }
        LocalDateTime now = LocalDateTime.now(BUSINESS_ZONE);
        String normalizedType = resolveEffectiveOrderType(orderType, items, now);
        String occupyStatus = "WALK_IN".equals(normalizedType) ? "USING" : "BOOKED";
        jdbc.update("""
                insert into gym_order(id, order_no, user_id, order_type, order_status, payment_status, pay_amount_cent, use_status, created_at)
                values(?,?,?,?,?,?,?,?,?)
                """, orderId, orderNo, blankTo(userId, "app-user-001"), normalizedType, "PENDING_PAY", "UNPAID", amountCent, "RESERVED", now);
        for (Map<String, Object> item : items) {
            try {
                jdbc.update("""
                        insert into gym_order_item(order_id, venue_id, venue_name, store_id, package_id, biz_date, start_time, end_time, price_cent)
                        values(?,?,?,?,?,?,?,?,?)
                        """, orderId, item.get("venueId"), item.get("venueName"), item.get("storeId"), item.get("packageId"),
                        item.get("bizDate"), item.get("startTime"), item.get("endTime"), item.get("priceCent"));
                jdbc.update("""
                        insert into venue_occupancy(order_id, venue_id, biz_date, start_time, end_time, occupy_status)
                        values(?,?,?,?,?,?)
                        """, orderId, item.get("venueId"), item.get("bizDate"), item.get("startTime"), item.get("endTime"), occupyStatus);
            } catch (DuplicateKeyException ex) {
                throw new BizException(ErrorCode.VENUE_UNAVAILABLE, "场地时段已被占用，请重新选择");
            }
        }
        return order(orderId);
    }

    public List<Map<String, Object>> orders() {
        List<Map<String, Object>> orders = jdbc.queryForList("""
                select o.id, o.id as orderId, o.order_no as orderNo,
                       case o.order_type when 'WALK_IN' then '开场订单' else '预约订单' end as type,
                       o.order_type as orderType, u.nickname as user, u.phone_masked as phone,
                       o.order_status as orderStatusCode,
                       case o.order_status
                           when 'PENDING_PAY' then '待支付'
                           when 'PAID' then '待到场'
                           when 'IN_USE' then '使用中'
                           when 'COMPLETED' then '已完成'
                           when 'CANCELLED' then '已取消'
                           when 'REFUNDING' then '退款中'
                           when 'REFUNDED' then '已退款'
                           else o.order_status
                       end as orderStatus,
                       o.payment_status as paymentStatus,
                       case o.payment_status when 'PAID' then '已支付' when 'UNPAID' then '待支付' else o.payment_status end as payStatus,
                       o.use_status as useStatus,
                       o.pay_amount_cent / 100 as amount, o.pay_amount_cent as payAmountCent,
                       o.created_at as createdAt
                from gym_order o
                left join user_profile u on u.id = o.user_id
                order by o.created_at desc
                """);
        orders.forEach(this::attachOrderItems);
        return orders;
    }

    public Map<String, Object> order(String orderIdOrNo) {
        Map<String, Object> order = singleOrEmpty("""
                select o.id, o.id as orderId, o.order_no as orderNo,
                       case o.order_type when 'WALK_IN' then '开场订单' else '预约订单' end as type,
                       o.order_type as orderType, u.nickname as user, u.phone_masked as phone,
                       o.order_status as orderStatusCode,
                       case o.order_status
                           when 'PENDING_PAY' then '待支付'
                           when 'PAID' then '待到场'
                           when 'IN_USE' then '使用中'
                           when 'COMPLETED' then '已完成'
                           when 'CANCELLED' then '已取消'
                           when 'REFUNDING' then '退款中'
                           when 'REFUNDED' then '已退款'
                           else o.order_status
                       end as orderStatus,
                       o.payment_status as paymentStatus,
                       case o.payment_status when 'PAID' then '已支付' when 'UNPAID' then '待支付' else o.payment_status end as payStatus,
                       o.use_status as useStatus,
                       o.pay_amount_cent / 100 as amount, o.pay_amount_cent as payAmountCent,
                       o.created_at as createdAt
                from gym_order o
                left join user_profile u on u.id = o.user_id
                where o.id = ? or o.order_no = ?
                """, orderIdOrNo, orderIdOrNo);
        if (!order.isEmpty()) {
            attachOrderItems(order);
        }
        return order;
    }

    @Transactional
    public Map<String, Object> createPayment(String orderNo) {
        Map<String, Object> order = order(orderNo);
        if (order.isEmpty()) {
            throw new BizException(ErrorCode.RESOURCE_NOT_FOUND, "订单不存在");
        }
        String paymentNo = "P" + System.currentTimeMillis();
        jdbc.update("""
                insert into payment_record(payment_no, order_no, pay_channel, payment_status, amount_cent, refund_status, callback, created_at)
                values(?,?,?,?,?,?,?,?)
                """, paymentNo, order.get("orderNo"), "MOCK_WECHAT", "PROCESSING", number(order.get("payAmountCent"), 0), "NONE", "WAITING", LocalDateTime.now());
        return payment(paymentNo);
    }

    @Transactional
    public Map<String, Object> mockPaymentSuccess(String orderNo, String paymentNo) {
        Map<String, Object> order = order(blankTo(orderNo, ""));
        if (order.isEmpty() && paymentNo != null && !paymentNo.isBlank()) {
            Map<String, Object> pay = payment(paymentNo);
            order = order(string(pay.get("orderNo"), ""));
        }
        if (order.isEmpty()) {
            throw new BizException(ErrorCode.RESOURCE_NOT_FOUND, "订单不存在");
        }
        String nextPaymentNo = blankTo(paymentNo, "P" + System.currentTimeMillis());
        Integer exists = jdbc.queryForObject("select count(1) from payment_record where payment_no = ?", Integer.class, nextPaymentNo);
        if (exists == null || exists == 0) {
            jdbc.update("""
                    insert into payment_record(payment_no, order_no, pay_channel, payment_status, amount_cent, refund_status, callback, paid_at, created_at)
                    values(?,?,?,?,?,?,?,?,?)
                    """, nextPaymentNo, order.get("orderNo"), "MOCK_WECHAT", "SUCCESS", number(order.get("payAmountCent"), 0), "NONE", "MOCK_SUCCESS", LocalDateTime.now(), LocalDateTime.now());
        } else {
            jdbc.update("update payment_record set payment_status = 'SUCCESS', callback = 'MOCK_SUCCESS', paid_at = coalesce(paid_at, ?) where payment_no = ?", LocalDateTime.now(), nextPaymentNo);
        }
        jdbc.update("update gym_order set payment_status = 'PAID', order_status = case when order_type = 'WALK_IN' then 'IN_USE' else 'PAID' end, use_status = case when order_type = 'WALK_IN' then 'IN_USE' else 'RESERVED' end where order_no = ?",
                order.get("orderNo"));
        addPoints(string(order.get("id"), ""), 20, "完成支付");
        return payment(nextPaymentNo);
    }

    public Map<String, Object> payment(String paymentNo) {
        return singleOrEmpty("""
                select p.payment_no as paymentNo, p.order_no as orderNo, p.pay_channel as method,
                       r.id as refundId,
                       p.payment_status as paymentStatus,
                       case p.payment_status when 'SUCCESS' then '成功' when 'FAILED' then '失败' else '处理中' end as payStatus,
                       p.amount_cent / 100 as amount, p.amount_cent as amountCent,
                       p.refund_status as refundStatusCode,
                       case p.refund_status when 'NONE' then '无退款' when 'APPLYING' then '待审核' when 'APPROVED' then '同意退款' when 'REJECTED' then '拒绝退款' else p.refund_status end as refundStatus,
                       p.paid_at as paidAt, p.callback
                from payment_record p
                left join refund_request r on r.order_no = p.order_no and r.refund_status = 'APPLYING'
                where p.payment_no = ?
                """, paymentNo);
    }

    public List<Map<String, Object>> payments() {
        return jdbc.queryForList("""
                select p.payment_no as paymentNo, p.order_no as orderNo, p.pay_channel as method,
                       r.id as refundId,
                       p.payment_status as paymentStatus,
                       case p.payment_status when 'SUCCESS' then '成功' when 'FAILED' then '失败' else '处理中' end as payStatus,
                       p.amount_cent / 100 as amount, p.amount_cent as amountCent,
                       p.refund_status as refundStatusCode,
                       case p.refund_status when 'NONE' then '无退款' when 'APPLYING' then '待审核' when 'APPROVED' then '同意退款' when 'REJECTED' then '拒绝退款' else p.refund_status end as refundStatus,
                       p.paid_at as paidAt, p.callback
                from payment_record p
                left join refund_request r on r.order_no = p.order_no and r.refund_status = 'APPLYING'
                order by p.created_at desc
                """);
    }

    public Map<String, Object> paymentSummary() {
        int todayAmountCent = number(jdbc.queryForObject("""
                select coalesce(sum(amount_cent),0)
                from payment_record
                where payment_status = 'SUCCESS' and date(coalesce(paid_at, created_at)) = current_date
                """, Integer.class), 0);
        int totalCount = number(jdbc.queryForObject("""
                select count(1)
                from payment_record
                where date(created_at) = current_date
                """, Integer.class), 0);
        int successCount = number(jdbc.queryForObject("""
                select count(1)
                from payment_record
                where payment_status = 'SUCCESS' and date(coalesce(paid_at, created_at)) = current_date
                """, Integer.class), 0);
        int pendingRefundCount = number(jdbc.queryForObject("select count(1) from refund_request where refund_status = 'APPLYING'", Integer.class), 0);
        int callbackErrorCount = number(jdbc.queryForObject("""
                select count(1)
                from payment_record
                where callback not in ('', 'SUCCESS', 'MOCK_SUCCESS', 'WAITING') or payment_status = 'FAILED'
                """, Integer.class), 0);
        double successRate = totalCount == 0 ? 0 : successCount * 1.0 / totalCount;
        return map(
                "todayAmountCent", todayAmountCent,
                "successCount", successCount,
                "totalCount", totalCount,
                "successRate", successRate,
                "pendingRefundCount", pendingRefundCount,
                "callbackErrorCount", callbackErrorCount
        );
    }

    public List<Map<String, Object>> reviews() {
        return jdbc.queryForList("""
                select r.id, r.id as reviewId, u.nickname as user, v.name as venue, r.order_id as orderId,
                       r.rating, r.content, r.audit_status as status, r.submitted_at as submittedAt, r.reply
                from order_review r
                left join user_profile u on u.id = r.user_id
                left join venue v on v.id = r.venue_id
                order by r.submitted_at desc
                """);
    }

    @Transactional
    public Map<String, Object> cancelOrder(String orderIdOrNo) {
        Map<String, Object> target = order(orderIdOrNo);
        if (target.isEmpty()) {
            throw new BizException(ErrorCode.RESOURCE_NOT_FOUND, "订单不存在");
        }
        jdbc.update("update gym_order set order_status = 'CANCELLED', use_status = 'CANCELLED' where id = ?",
                target.get("id"));
        jdbc.update("update venue_occupancy set occupy_status = 'CANCELLED' where order_id = ?",
                target.get("id"));
        return order(string(target.get("id"), ""));
    }

    @Transactional
    public Map<String, Object> arriveOrder(String orderIdOrNo) {
        Map<String, Object> target = order(orderIdOrNo);
        if (target.isEmpty()) {
            throw new BizException(ErrorCode.RESOURCE_NOT_FOUND, "订单不存在");
        }
        jdbc.update("update gym_order set order_status = 'IN_USE', use_status = 'IN_USE' where id = ?",
                target.get("id"));
        jdbc.update("update venue_occupancy set occupy_status = 'USING' where order_id = ?",
                target.get("id"));
        return order(string(target.get("id"), ""));
    }

    @Transactional
    public Map<String, Object> applyRefund(String orderIdOrNo, String reason) {
        Map<String, Object> target = order(orderIdOrNo);
        if (target.isEmpty()) {
            throw new BizException(ErrorCode.RESOURCE_NOT_FOUND, "订单不存在");
        }
        String orderNo = string(target.get("orderNo"), "");
        String refundId = jdbc.query("""
                select id from refund_request where order_no = ? and refund_status = 'APPLYING' order by created_at desc limit 1
                """, rs -> rs.next() ? rs.getString(1) : null, orderNo);
        if (refundId == null) {
            refundId = "refund-" + System.currentTimeMillis();
            jdbc.update("""
                    insert into refund_request(id, order_no, refund_status, reason, created_at)
                    values(?,?,?,?,?)
                    """, refundId, orderNo, "APPLYING", blankTo(reason, "后台申请退款"), LocalDateTime.now());
        }
        jdbc.update("update gym_order set order_status = 'REFUNDING' where id = ?", target.get("id"));
        jdbc.update("update payment_record set refund_status = 'APPLYING' where order_no = ?", orderNo);
        return map("refundId", refundId, "orderNo", orderNo, "refundStatus", "APPLYING");
    }

    @Transactional
    public Map<String, Object> auditRefund(String refundId, boolean approved, String remark) {
        Map<String, Object> refund = singleOrEmpty("""
                select id, order_no as orderNo, refund_status as refundStatus, reason
                from refund_request
                where id = ?
                """, refundId);
        if (refund.isEmpty()) {
            throw new BizException(ErrorCode.RESOURCE_NOT_FOUND, "退款申请不存在");
        }
        String nextStatus = approved ? "APPROVED" : "REJECTED";
        String orderNo = string(refund.get("orderNo"), "");
        jdbc.update("update refund_request set refund_status = ?, reason = concat(coalesce(reason, ''), ?) where id = ?",
                nextStatus, remark == null || remark.isBlank() ? "" : "；审核备注：" + remark, refundId);
        jdbc.update("update payment_record set refund_status = ? where order_no = ?", nextStatus, orderNo);
        jdbc.update("update gym_order set order_status = ? where order_no = ?",
                approved ? "REFUNDED" : "PAID", orderNo);
        return map("refundId", refundId, "orderNo", orderNo, "auditStatus", nextStatus);
    }

    @Transactional
    public Map<String, Object> updateReview(String reviewId, Map<String, Object> payload) {
        Map<String, Object> review = singleOrEmpty("select id from order_review where id = ?", reviewId);
        if (review.isEmpty()) {
            throw new BizException(ErrorCode.RESOURCE_NOT_FOUND, "评价不存在");
        }
        String status = blankTo(string(payload == null ? null : payload.get("status"), ""), "");
        String reply = payload == null || payload.get("reply") == null ? null : String.valueOf(payload.get("reply"));
        if (!status.isBlank() && reply != null) {
            jdbc.update("update order_review set audit_status = ?, reply = ? where id = ?", status, reply, reviewId);
        } else if (!status.isBlank()) {
            jdbc.update("update order_review set audit_status = ? where id = ?", status, reviewId);
        } else if (reply != null) {
            jdbc.update("update order_review set reply = ? where id = ?", reply, reviewId);
        }
        return singleOrEmpty("""
                select r.id, r.id as reviewId, u.nickname as user, v.name as venue, r.order_id as orderId,
                       r.rating, r.content, r.audit_status as status, r.submitted_at as submittedAt, r.reply
                from order_review r
                left join user_profile u on u.id = r.user_id
                left join venue v on v.id = r.venue_id
                where r.id = ?
                """, reviewId);
    }

    public Map<String, Object> dashboard() {
        int revenueCent = number(jdbc.queryForObject("""
                select coalesce(sum(amount_cent),0)
                from payment_record
                where payment_status = 'SUCCESS' and date(coalesce(paid_at, created_at)) = current_date
                """, Integer.class), 0);
        int orderCount = number(jdbc.queryForObject("select count(1) from gym_order where date(created_at) = current_date", Integer.class), 0);
        int reservationCount = number(jdbc.queryForObject("select count(1) from gym_order where order_type = 'RESERVATION' and date(created_at) = current_date", Integer.class), 0);
        int walkInCount = number(jdbc.queryForObject("select count(1) from gym_order where order_type = 'WALK_IN' and date(created_at) = current_date", Integer.class), 0);
        double venueUsageRate = venueUsageRate();
        return map(
                "revenueCent", revenueCent,
                "orderCount", orderCount,
                "reservationCount", reservationCount,
                "walkInCount", walkInCount,
                "pendingRefundCount", number(jdbc.queryForObject("select count(1) from refund_request where refund_status = 'APPLYING'", Integer.class), 0),
                "pendingReviewCount", number(jdbc.queryForObject("select count(1) from order_review where audit_status = '待审核'", Integer.class), 0),
                "maintenanceVenueCount", number(jdbc.queryForObject("select count(1) from venue where status = 'MAINTENANCE'", Integer.class), 0),
                "venueUsageRate", venueUsageRate,
                "memberGrowth", number(jdbc.queryForObject("select count(1) from user_profile", Integer.class), 0),
                "trends", trends(),
                "latestOrders", orders().stream().limit(5).toList(),
                "venueRanking", venueUsageRanking(),
                "sportDistribution", sportDistribution(),
                "paymentSummary", paymentSummary(),
                "userSummary", userSummary()
        );
    }

    public Map<String, Object> statistics() {
        return map(
                "trends", trends(),
                "venueUsageRanking", venueUsageRanking(),
                "sportDistribution", sportDistribution(),
                "stores", stores()
        );
    }

    private List<Map<String, Object>> trends() {
        return jdbc.queryForList("""
                select day_text as date, revenue_cent as revenueCent, order_count as orders, usage_rate as usageRate
                from (
                    select stat_date, day_text, revenue_cent, order_count, usage_rate
                    from daily_statistic
                    order by stat_date desc
                    limit 30
                ) t
                order by stat_date
                """);
    }

    private List<Map<String, Object>> venueUsageRanking() {
        return jdbc.queryForList("""
                select v.name,
                       v.sport,
                       coalesce(round(sum(timestampdiff(minute, o.start_time, o.end_time)) / (7 * 14 * 60) * 100), 0) as value
                from venue v
                left join venue_occupancy o on o.venue_id = v.id
                    and o.biz_date >= date_sub(current_date, interval 6 day)
                    and o.occupy_status in ('BOOKED','USING')
                group by v.id, v.name, v.sport
                order by value desc, v.code
                limit 10
                """);
    }

    private List<Map<String, Object>> sportDistribution() {
        return jdbc.queryForList("""
                select v.sport as name, count(o.id) as value
                from venue v
                left join gym_order_item i on i.venue_id = v.id
                left join gym_order o on o.id = i.order_id and o.created_at >= date_sub(current_date, interval 29 day)
                group by v.sport
                order by value desc, v.sport
                """);
    }

    private double venueUsageRate() {
        int venueCount = number(jdbc.queryForObject("select count(1) from venue where status <> 'DISABLED'", Integer.class), 0);
        if (venueCount == 0) return 0;
        int occupiedMinutes = number(jdbc.queryForObject("""
                select coalesce(sum(timestampdiff(minute, start_time, end_time)),0)
                from venue_occupancy
                where biz_date = current_date and occupy_status in ('BOOKED','USING')
                """, Integer.class), 0);
        return Math.min(1, occupiedMinutes * 1.0 / (venueCount * 14 * 60));
    }

    public Map<String, Object> map(Object... values) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (int i = 0; i + 1 < values.length; i += 2) {
            result.put(String.valueOf(values[i]), values[i + 1]);
        }
        return result;
    }

    private Map<String, Object> singleOrEmpty(String sql, Object... args) {
        List<Map<String, Object>> rows = jdbc.queryForList(sql, args);
        return rows.isEmpty() ? Map.of() : new LinkedHashMap<>(rows.get(0));
    }

    private void attachOrderItems(Map<String, Object> order) {
        List<Map<String, Object>> items = jdbc.queryForList("""
                select i.id as itemId, i.order_id as orderId, i.venue_id as venueId, i.venue_name as venueName,
                       i.store_id as storeId, s.name as store, i.package_id as packageId, i.biz_date as bizDate,
                       i.start_time as startTime, i.end_time as endTime, i.price_cent as priceCent, i.price_cent / 100 as price
                from gym_order_item i
                left join gym_store s on s.id = i.store_id
                where i.order_id = ?
                order by i.start_time
                """, order.get("id"));
        order.put("items", items);
        if (!items.isEmpty()) {
            Map<String, Object> first = items.get(0);
            order.put("store", first.get("store"));
            order.put("venue", first.get("venueName"));
            order.put("time", first.get("bizDate") + " " + first.get("startTime") + "-" + first.get("endTime"));
        }
    }

    private void addPoints(String orderId, int value, String title) {
        Map<String, Object> order = order(orderId);
        if (order.isEmpty()) return;
        String userId = string(singleOrEmpty("select user_id as userId from gym_order where id = ?", order.get("id")).get("userId"), "");
        if (userId.isBlank()) return;
        jdbc.update("update user_profile set points = points + ? where id = ?", value, userId);
        jdbc.update("insert into point_record(user_id, month_text, title, value, remark, created_at) values(?,?,?,?,?,?)",
                userId, LocalDate.now().toString().substring(0, 7), title, value, "订单 " + order.get("orderNo"), LocalDateTime.now());
    }

    private String phoneFromCode(String code) {
        String digits = String.valueOf(Math.abs(safe(code, "2026").hashCode()));
        String suffix = digits.length() > 9 ? digits.substring(0, 9) : String.format("%9s", digits).replace(' ', '0');
        return "13" + suffix.substring(0, 9);
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 11) return "138****2026";
        return phone.substring(0, 3) + "****" + phone.substring(7);
    }

    private List<String> permissions(String roleCode) {
        if ("STAFF".equals(roleCode)) return List.of("orders", "payments", "reviews");
        if ("MANAGER".equals(roleCode)) return List.of("dashboard", "stores", "venues", "orders", "payments", "users", "marketing", "reviews", "statistics");
        return List.of("dashboard", "stores", "venues", "orders", "payments", "users", "marketing", "reviews", "statistics", "system");
    }

    private String roleName(String roleCode) {
        return "STAFF".equals(roleCode) ? "员工" : "MANAGER".equals(roleCode) ? "店长" : "超级管理员";
    }

    private String storeStatusCode(String status) {
        return switch (status) {
            case "营业中", "OPEN" -> "OPEN";
            case "休息中", "RESTING" -> "RESTING";
            default -> "DISABLED";
        };
    }

    private String venueStatusCode(String status) {
        return switch (status) {
            case "空闲", "AVAILABLE" -> "AVAILABLE";
            case "使用中", "IN_USE" -> "IN_USE";
            case "已预定", "BOOKED" -> "BOOKED";
            case "维护中", "MAINTENANCE" -> "MAINTENANCE";
            default -> "DISABLED";
        };
    }

    private String resolveEffectiveOrderType(String orderType, List<Map<String, Object>> items, LocalDateTime now) {
        String requestedType = "WALK_IN".equalsIgnoreCase(orderType) || "WALKIN".equalsIgnoreCase(orderType) ? "WALK_IN" : "RESERVATION";
        if (!"WALK_IN".equals(requestedType)) {
            return "RESERVATION";
        }
        for (Map<String, Object> item : items) {
            LocalDate bizDate = (LocalDate) item.get("bizDate");
            LocalTime startTime = (LocalTime) item.get("startTime");
            if (LocalDateTime.of(bizDate, startTime).isAfter(now)) {
                return "RESERVATION";
            }
            if (!isStoreOpenNow(String.valueOf(item.get("storeId")), now.toLocalTime())) {
                return "RESERVATION";
            }
        }
        return "WALK_IN";
    }

    private boolean isStoreOpenNow(String storeId, LocalTime now) {
        Map<String, Object> store = singleOrEmpty("""
                select business_status as businessStatus, business_hours as businessHours
                from gym_store
                where id = ?
                """, storeId);
        if (!"OPEN".equals(String.valueOf(store.get("businessStatus")))) {
            return false;
        }
        return isTimeInBusinessHours(String.valueOf(store.get("businessHours")), now);
    }

    private boolean isTimeInBusinessHours(String businessHours, LocalTime now) {
        String[] parts = string(businessHours, "").split("-");
        if (parts.length != 2) {
            return false;
        }
        int current = now.getHour() * 60 + now.getMinute();
        int open = businessMinute(parts[0]);
        int close = businessMinute(parts[1]);
        if (open == close) {
            return false;
        }
        if (close > open) {
            return current >= open && current < close;
        }
        return current >= open || current < close;
    }

    private int businessMinute(String value) {
        String[] parts = value == null ? new String[0] : value.trim().split(":");
        if (parts.length < 2) {
            return 0;
        }
        int hour = number(parts[0], 0);
        int minute = number(parts[1], 0);
        if (hour >= 24) {
            return 24 * 60;
        }
        return Math.max(0, hour * 60 + minute);
    }

    private LocalTime parseTime(Object value) {
        String raw = string(value, "10:00");
        return raw.length() == 5 ? LocalTime.parse(raw + ":00") : LocalTime.parse(raw);
    }

    private int number(Object value, int fallback) {
        if (value instanceof Number number) return number.intValue();
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (Exception ex) {
            return fallback;
        }
    }

    private String string(Object value, String fallback) {
        return value == null || String.valueOf(value).isBlank() ? fallback : String.valueOf(value);
    }

    private String blankTo(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String safe(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) return value;
        }
        return "";
    }
}
