SET NAMES utf8mb4;
USE gym_operation;

UPDATE city SET name = '深圳' WHERE city_code = 'SZ';
UPDATE city SET name = '广州' WHERE city_code = 'GZ';

UPDATE admin_account SET name = '农佳磊' WHERE account = 'admin';
UPDATE admin_account SET name = '陈店长' WHERE account = 'manager';
UPDATE admin_account SET name = '值班员工' WHERE account = 'staff';

UPDATE user_profile
SET nickname = '小林', level_name = 'LV.3 运动达人', status = '正常'
WHERE id = 'app-user-001';
UPDATE user_profile
SET nickname = '阿杰', level_name = 'LV.2 活力先锋', status = '正常'
WHERE id = 'app-user-002';

UPDATE gym_store
SET name = '伊幺体育中心店',
    city = '深圳',
    address = '南山区科技园运动路18号',
    business_hours = '09:00-24:00',
    manager = '陈店长'
WHERE id = 'store-001';
UPDATE gym_store
SET name = '伊幺体育龙华馆',
    city = '深圳',
    address = '龙华区民治大道66号',
    business_hours = '10:00-02:00',
    manager = '李店长'
WHERE id = 'store-002';
UPDATE gym_store
SET name = '伊幺体育天河馆',
    city = '广州',
    address = '天河区体育西路99号',
    business_hours = '08:00-23:00',
    manager = '吴店长'
WHERE id = 'store-003';

UPDATE venue SET name = 'A1 全场篮球馆', sport = '篮球' WHERE id = 'venue-001';
UPDATE venue SET name = 'B2 羽毛球场', sport = '羽毛球' WHERE id = 'venue-002';
UPDATE venue SET name = 'C3 气排球场', sport = '气排球' WHERE id = 'venue-003';
UPDATE venue SET name = 'D1 乒乓球台', sport = '乒乓球' WHERE id = 'venue-004';
UPDATE venue SET name = 'P1 匹克球场', sport = '匹克球' WHERE id = 'venue-005';

UPDATE venue_package SET venue_sport = '篮球', name = '篮球单场 1 小时' WHERE id = 'pkg-001';
UPDATE venue_package SET venue_sport = '篮球', name = '篮球畅打 2 小时' WHERE id = 'pkg-002';
UPDATE venue_package SET venue_sport = '羽毛球', name = '羽毛球标准 1 小时' WHERE id = 'pkg-003';
UPDATE venue_package SET venue_sport = '气排球', name = '气排球团队 2 小时' WHERE id = 'pkg-004';

UPDATE gym_order_item SET venue_name = 'A1 全场篮球馆' WHERE order_id = 'O202605180001';
UPDATE gym_order_item SET venue_name = 'B2 羽毛球场' WHERE order_id = 'O202605180002';

UPDATE coupon_template
SET name = '满 99 减 20', scope = '全场馆通用', status = '发放中', valid_text = '2026-05-01 至 2026-06-30'
WHERE id = 'C001';
UPDATE coupon_template
SET name = '羽毛球 8 折券', scope = '羽毛球项目', status = '发放中', valid_text = '2026-05-01 至 2026-05-31'
WHERE id = 'C002';

UPDATE activity
SET title = '周末篮球拼场季',
    activity_type = '满减活动',
    store_scope = '中心店',
    time_text = '2026-05-16 至 2026-06-30',
    status = '上架',
    rules = '周末篮球预约满 99 元立减 20 元。'
WHERE id = 'A001';
UPDATE activity
SET title = '会员日双倍伊幺币',
    activity_type = '会员活动',
    store_scope = '全部门店',
    time_text = '每周三',
    status = '上架',
    rules = '会员日支付成功后双倍积分。'
WHERE id = 'A002';

UPDATE member_level
SET name = '运动新星', benefits = '新人体验券、基础预约提醒、会员日经验累计'
WHERE level_code = 'LV1';
UPDATE member_level
SET name = '活力先锋', benefits = '预约优先提醒、会员日双倍经验、活动优先报名'
WHERE level_code = 'LV2';
UPDATE member_level
SET name = '运动达人', benefits = '专属场地券、预约提醒增强、活动名额优先、会员日双倍经验'
WHERE level_code = 'LV3';

UPDATE point_record
SET title = '支付成功赠送', remark = '订单 YY202605180001'
WHERE user_id = 'app-user-001' AND created_at = '2026-05-18 10:13:00';
UPDATE point_record
SET title = '会员日加赠', remark = '活动 A002'
WHERE user_id = 'app-user-001' AND created_at = '2026-05-15 20:00:00';

UPDATE order_review
SET content = '场地很新，灯光舒服。', audit_status = '已展示', reply = '感谢支持，欢迎再来。'
WHERE id = 'R001';
UPDATE order_review
SET content = '整体不错，高峰期人有点多。', audit_status = '待审核', reply = ''
WHERE id = 'R002';

UPDATE operation_log
SET operator = '农佳磊', module_name = '订单管理', action_text = '确认到场'
WHERE created_at = '2026-05-18 10:52:00';
UPDATE operation_log
SET operator = '陈店长', module_name = '场地管理', action_text = '维护场地状态'
WHERE created_at = '2026-05-18 09:44:00';

SELECT id, name, sport FROM venue ORDER BY id LIMIT 5;
SELECT id, nickname, level_name FROM user_profile ORDER BY id LIMIT 5;
