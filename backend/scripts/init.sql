SET NAMES utf8mb4;
SET character_set_client = utf8mb4;
SET character_set_connection = utf8mb4;
SET character_set_results = utf8mb4;

CREATE DATABASE IF NOT EXISTS gym_operation DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE gym_operation;

CREATE TABLE IF NOT EXISTS city (
  city_code VARCHAR(32) PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  hot TINYINT NOT NULL DEFAULT 0,
  letter VARCHAR(8) NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_account (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  account VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(128) NOT NULL,
  name VARCHAR(64) NOT NULL,
  role_code VARCHAR(32) NOT NULL,
  store_id VARCHAR(64) DEFAULT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'NORMAL',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profile (
  id VARCHAR(64) PRIMARY KEY,
  openid VARCHAR(128) DEFAULT NULL,
  phone VARCHAR(32) DEFAULT NULL,
  phone_masked VARCHAR(32) DEFAULT NULL,
  nickname VARCHAR(64) NOT NULL,
  avatar_url VARCHAR(500) DEFAULT '',
  level_name VARCHAR(64) NOT NULL DEFAULT 'LV.1 运动新星',
  points INT NOT NULL DEFAULT 0,
  coupons_count INT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT '正常',
  registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_openid (openid),
  KEY idx_user_phone (phone)
);

CREATE TABLE IF NOT EXISTS gym_store (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  city VARCHAR(32) NOT NULL,
  address VARCHAR(255) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  business_status VARCHAR(32) NOT NULL,
  business_hours VARCHAR(64) NOT NULL,
  manager VARCHAR(64) DEFAULT '',
  distance_text VARCHAR(32) DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS venue (
  id VARCHAR(64) PRIMARY KEY,
  store_id VARCHAR(64) NOT NULL,
  code VARCHAR(32) NOT NULL,
  name VARCHAR(128) NOT NULL,
  sport VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL,
  capacity INT NOT NULL DEFAULT 1,
  base_price_cent INT NOT NULL,
  bookable_time VARCHAR(64) NOT NULL,
  image_url VARCHAR(500) DEFAULT '',
  KEY idx_venue_store (store_id)
);

CREATE TABLE IF NOT EXISTS venue_package (
  id VARCHAR(64) PRIMARY KEY,
  venue_sport VARCHAR(32) NOT NULL,
  name VARCHAR(128) NOT NULL,
  duration_minutes INT NOT NULL,
  origin_price_cent INT NOT NULL,
  price_cent INT NOT NULL,
  enabled TINYINT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS gym_order (
  id VARCHAR(64) PRIMARY KEY,
  order_no VARCHAR(64) NOT NULL UNIQUE,
  user_id VARCHAR(64) NOT NULL,
  order_type VARCHAR(32) NOT NULL,
  order_status VARCHAR(32) NOT NULL,
  payment_status VARCHAR(32) NOT NULL,
  use_status VARCHAR(32) NOT NULL DEFAULT 'RESERVED',
  pay_amount_cent INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_order_user (user_id),
  KEY idx_order_created (created_at)
);

CREATE TABLE IF NOT EXISTS gym_order_item (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id VARCHAR(64) NOT NULL,
  venue_id VARCHAR(64) NOT NULL,
  venue_name VARCHAR(128) NOT NULL,
  store_id VARCHAR(64) NOT NULL,
  package_id VARCHAR(64) DEFAULT '',
  biz_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  price_cent INT NOT NULL,
  KEY idx_order_item_order (order_id),
  KEY idx_order_item_venue_time (venue_id, biz_date, start_time, end_time)
);

CREATE TABLE IF NOT EXISTS venue_occupancy (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id VARCHAR(64) NOT NULL,
  venue_id VARCHAR(64) NOT NULL,
  biz_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  occupy_status VARCHAR(32) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_venue_exact_time (venue_id, biz_date, start_time, end_time),
  KEY idx_venue_occupancy_lookup (venue_id, biz_date, occupy_status)
);

CREATE TABLE IF NOT EXISTS payment_record (
  payment_no VARCHAR(64) PRIMARY KEY,
  order_no VARCHAR(64) NOT NULL,
  pay_channel VARCHAR(32) NOT NULL,
  payment_status VARCHAR(32) NOT NULL,
  amount_cent INT NOT NULL,
  refund_status VARCHAR(32) NOT NULL DEFAULT 'NONE',
  callback VARCHAR(64) DEFAULT '',
  paid_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_payment_order (order_no)
);

CREATE TABLE IF NOT EXISTS refund_request (
  id VARCHAR(64) PRIMARY KEY,
  order_no VARCHAR(64) NOT NULL,
  refund_status VARCHAR(32) NOT NULL,
  reason VARCHAR(255) DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coupon_template (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  amount_cent INT NOT NULL,
  threshold_cent INT NOT NULL,
  scope VARCHAR(128) NOT NULL,
  total_count INT NOT NULL DEFAULT 0,
  used_count INT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL,
  valid_text VARCHAR(128) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(128) NOT NULL,
  activity_type VARCHAR(64) NOT NULL,
  store_scope VARCHAR(128) NOT NULL,
  time_text VARCHAR(128) NOT NULL,
  status VARCHAR(32) NOT NULL,
  visits INT NOT NULL DEFAULT 0,
  rules VARCHAR(1000) DEFAULT '',
  image_url VARCHAR(500) DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS member_level (
  level_code VARCHAR(32) PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  discount_rate INT NOT NULL,
  benefits VARCHAR(500) NOT NULL,
  min_points INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS point_record (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(64) NOT NULL,
  month_text VARCHAR(16) NOT NULL,
  title VARCHAR(128) NOT NULL,
  value INT NOT NULL,
  remark VARCHAR(255) DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_point_user (user_id)
);

CREATE TABLE IF NOT EXISTS order_review (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  venue_id VARCHAR(64) NOT NULL,
  rating INT NOT NULL,
  content VARCHAR(500) NOT NULL,
  audit_status VARCHAR(32) NOT NULL,
  reply VARCHAR(500) DEFAULT '',
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS operation_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  operator VARCHAR(64) NOT NULL,
  module_name VARCHAR(64) NOT NULL,
  action_text VARCHAR(255) NOT NULL,
  ip VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_statistic (
  stat_date DATE PRIMARY KEY,
  day_text VARCHAR(16) NOT NULL,
  revenue_cent INT NOT NULL DEFAULT 0,
  order_count INT NOT NULL DEFAULT 0,
  usage_rate INT NOT NULL DEFAULT 0
);

INSERT IGNORE INTO city(city_code, name, hot, letter) VALUES
('SZ', '深圳', 1, 'S'),
('GZ', '广州', 1, 'G');

INSERT IGNORE INTO admin_account(account, password_hash, name, role_code, store_id, status) VALUES
('admin', '$2a$10$demo', '农佳磊', 'SUPER_ADMIN', NULL, 'NORMAL'),
('manager', '$2a$10$demo', '陈店长', 'MANAGER', 'store-001', 'NORMAL'),
('staff', '$2a$10$demo', '值班员工', 'STAFF', 'store-001', 'NORMAL');

INSERT IGNORE INTO user_profile(id, openid, phone, phone_masked, nickname, avatar_url, level_name, points, coupons_count, status, registered_at) VALUES
('app-user-001', 'openid-seed-001', '13812345678', '138****5678', '小林', '', 'LV.3 运动达人', 2680, 3, '正常', '2026-04-08 10:00:00'),
('app-user-002', 'openid-seed-002', '13612345678', '136****5678', '阿杰', '', 'LV.2 活力先锋', 980, 1, '正常', '2026-04-12 09:30:00');

INSERT IGNORE INTO gym_store(id, name, city, address, phone, business_status, business_hours, manager, distance_text, created_at) VALUES
('store-001', '伊幺体育中心店', '深圳', '南山区科技园运动路18号', '0755-88886666', 'OPEN', '09:00-24:00', '陈店长', '1.2km', '2026-04-01 09:00:00'),
('store-002', '伊幺体育龙华馆', '深圳', '龙华区民治大道66号', '0755-88668888', 'OPEN', '10:00-02:00', '李店长', '5.6km', '2026-04-06 09:00:00'),
('store-003', '伊幺体育天河馆', '广州', '天河区体育西路99号', '020-86669999', 'RESTING', '08:00-23:00', '吴店长', '18km', '2026-04-12 09:00:00');

INSERT IGNORE INTO venue(id, store_id, code, name, sport, status, capacity, base_price_cent, bookable_time, image_url) VALUES
('venue-001', 'store-001', 'A1', 'A1 全场篮球馆', '篮球', 'AVAILABLE', 12, 8800, '09:00-24:00', ''),
('venue-002', 'store-001', 'B2', 'B2 羽毛球场', '羽毛球', 'AVAILABLE', 4, 3600, '09:00-24:00', ''),
('venue-003', 'store-001', 'C3', 'C3 气排球场', '气排球', 'AVAILABLE', 10, 5800, '10:00-22:00', ''),
('venue-004', 'store-002', 'D1', 'D1 乒乓球台', '乒乓球', 'MAINTENANCE', 2, 2800, '10:00-02:00', ''),
('venue-005', 'store-002', 'P1', 'P1 匹克球场', '匹克球', 'AVAILABLE', 4, 4800, '10:00-02:00', '');

INSERT IGNORE INTO venue_package(id, venue_sport, name, duration_minutes, origin_price_cent, price_cent, enabled) VALUES
('pkg-001', '篮球', '篮球单场 1 小时', 60, 9800, 8800, 1),
('pkg-002', '篮球', '篮球畅打 2 小时', 120, 17600, 15800, 1),
('pkg-003', '羽毛球', '羽毛球标准 1 小时', 60, 4500, 3600, 1),
('pkg-004', '气排球', '气排球团队 2 小时', 120, 11600, 10800, 1);

INSERT IGNORE INTO gym_order(id, order_no, user_id, order_type, order_status, payment_status, use_status, pay_amount_cent, created_at) VALUES
('O202605180001', 'YY202605180001', 'app-user-001', 'RESERVATION', 'PAID', 'PAID', 'RESERVED', 15800, '2026-05-18 10:12:00'),
('O202605180002', 'YY202605180002', 'app-user-002', 'WALK_IN', 'IN_USE', 'PAID', 'IN_USE', 3600, '2026-05-18 10:48:00');

INSERT IGNORE INTO gym_order_item(order_id, venue_id, venue_name, store_id, package_id, biz_date, start_time, end_time, price_cent) VALUES
('O202605180001', 'venue-001', 'A1 全场篮球馆', 'store-001', 'pkg-002', '2026-05-18', '19:00:00', '21:00:00', 15800),
('O202605180002', 'venue-002', 'B2 羽毛球场', 'store-001', 'pkg-003', '2026-05-18', '11:00:00', '12:00:00', 3600);

INSERT IGNORE INTO venue_occupancy(order_id, venue_id, biz_date, start_time, end_time, occupy_status) VALUES
('O202605180001', 'venue-001', '2026-05-18', '19:00:00', '21:00:00', 'BOOKED'),
('O202605180002', 'venue-002', '2026-05-18', '11:00:00', '12:00:00', 'USING');

INSERT IGNORE INTO payment_record(payment_no, order_no, pay_channel, payment_status, amount_cent, refund_status, callback, paid_at, created_at) VALUES
('P202605180001', 'YY202605180001', 'WECHAT', 'SUCCESS', 15800, 'NONE', 'SUCCESS', '2026-05-18 10:13:00', '2026-05-18 10:13:00'),
('P202605180002', 'YY202605180002', 'WECHAT', 'SUCCESS', 3600, 'NONE', 'SUCCESS', '2026-05-18 10:49:00', '2026-05-18 10:49:00');

INSERT IGNORE INTO coupon_template(id, name, amount_cent, threshold_cent, scope, total_count, used_count, status, valid_text, created_at) VALUES
('C001', '满 99 减 20', 2000, 9900, '全场馆通用', 500, 132, '发放中', '2026-05-01 至 2026-06-30', '2026-05-01 00:00:00'),
('C002', '羽毛球 8 折券', 1200, 3000, '羽毛球项目', 200, 61, '发放中', '2026-05-01 至 2026-05-31', '2026-05-01 00:00:00');

INSERT IGNORE INTO activity(id, title, activity_type, store_scope, time_text, status, visits, rules, image_url, created_at) VALUES
('A001', '周末篮球拼场季', '满减活动', '中心店', '2026-05-16 至 2026-06-30', '上架', 4280, '周末篮球预约满 99 元立减 20 元。', '', '2026-05-16 00:00:00'),
('A002', '会员日双倍伊幺币', '会员活动', '全部门店', '每周三', '上架', 3180, '会员日支付成功后双倍积分。', '', '2026-05-01 00:00:00');

INSERT IGNORE INTO member_level(level_code, name, discount_rate, benefits, min_points) VALUES
('LV1', '运动新星', 100, '新人体验券、基础预约提醒、会员日经验累计', 0),
('LV2', '活力先锋', 95, '预约优先提醒、会员日双倍经验、活动优先报名', 800),
('LV3', '运动达人', 90, '专属场地券、预约提醒增强、活动名额优先、会员日双倍经验', 2000);

INSERT IGNORE INTO point_record(user_id, month_text, title, value, remark, created_at) VALUES
('app-user-001', '2026-05', '支付成功赠送', 20, '订单 YY202605180001', '2026-05-18 10:13:00'),
('app-user-001', '2026-05', '会员日加赠', 30, '活动 A002', '2026-05-15 20:00:00');

INSERT IGNORE INTO order_review(id, order_id, user_id, venue_id, rating, content, audit_status, reply, submitted_at) VALUES
('R001', 'O202605180001', 'app-user-001', 'venue-001', 5, '场地很新，灯光舒服。', '已展示', '感谢支持，欢迎再来。', '2026-05-18 20:12:00'),
('R002', 'O202605180002', 'app-user-002', 'venue-002', 4, '整体不错，高峰期人有点多。', '待审核', '', '2026-05-18 14:31:00');

INSERT IGNORE INTO operation_log(operator, module_name, action_text, ip, created_at) VALUES
('农佳磊', '订单管理', '确认到场', '127.0.0.1', '2026-05-18 10:52:00'),
('陈店长', '场地管理', '维护场地状态', '127.0.0.1', '2026-05-18 09:44:00');

INSERT IGNORE INTO daily_statistic(stat_date, day_text, revenue_cent, order_count, usage_rate) VALUES
('2026-05-12', '5/12', 268000, 32, 56),
('2026-05-13', '5/13', 312000, 38, 62),
('2026-05-14', '5/14', 298000, 35, 59),
('2026-05-15', '5/15', 356000, 41, 66),
('2026-05-16', '5/16', 489000, 56, 78),
('2026-05-17', '5/17', 526000, 61, 82),
('2026-05-18', '5/18', 438000, 49, 73);
