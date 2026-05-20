SET NAMES utf8mb4;
USE gym_operation;

UPDATE admin_account
SET name = CONVERT(BINARY CONVERT(name USING latin1) USING utf8mb4)
WHERE name LIKE '%å%';

UPDATE user_profile
SET nickname = CONVERT(BINARY CONVERT(nickname USING latin1) USING utf8mb4),
    level_name = CONVERT(BINARY CONVERT(level_name USING latin1) USING utf8mb4),
    status = CONVERT(BINARY CONVERT(status USING latin1) USING utf8mb4)
WHERE nickname LIKE '%å%'
   OR level_name LIKE '%å%'
   OR status LIKE '%å%';

UPDATE gym_store
SET name = CONVERT(BINARY CONVERT(name USING latin1) USING utf8mb4),
    address = CONVERT(BINARY CONVERT(address USING latin1) USING utf8mb4),
    business_hours = CONVERT(BINARY CONVERT(business_hours USING latin1) USING utf8mb4),
    business_status = CONVERT(BINARY CONVERT(business_status USING latin1) USING utf8mb4),
    manager = CONVERT(BINARY CONVERT(manager USING latin1) USING utf8mb4),
    distance_text = CONVERT(BINARY CONVERT(distance_text USING latin1) USING utf8mb4)
WHERE name LIKE '%å%'
   OR address LIKE '%å%'
   OR business_hours LIKE '%å%'
   OR business_status LIKE '%å%'
   OR manager LIKE '%å%'
   OR distance_text LIKE '%å%';

UPDATE venue
SET name = CONVERT(BINARY CONVERT(name USING latin1) USING utf8mb4),
    sport = CONVERT(BINARY CONVERT(sport USING latin1) USING utf8mb4)
WHERE name LIKE '%å%'
   OR sport LIKE '%å%';

UPDATE venue_package
SET venue_sport = CONVERT(BINARY CONVERT(venue_sport USING latin1) USING utf8mb4),
    name = CONVERT(BINARY CONVERT(name USING latin1) USING utf8mb4)
WHERE venue_sport LIKE '%å%'
   OR name LIKE '%å%';

UPDATE gym_order_item
SET venue_name = CONVERT(BINARY CONVERT(venue_name USING latin1) USING utf8mb4)
WHERE venue_name LIKE '%å%';

UPDATE coupon_template
SET name = CONVERT(BINARY CONVERT(name USING latin1) USING utf8mb4),
    scope = CONVERT(BINARY CONVERT(scope USING latin1) USING utf8mb4),
    status = CONVERT(BINARY CONVERT(status USING latin1) USING utf8mb4),
    valid_text = CONVERT(BINARY CONVERT(valid_text USING latin1) USING utf8mb4)
WHERE name LIKE '%å%'
   OR scope LIKE '%å%'
   OR status LIKE '%å%'
   OR valid_text LIKE '%å%';

UPDATE activity
SET title = CONVERT(BINARY CONVERT(title USING latin1) USING utf8mb4),
    activity_type = CONVERT(BINARY CONVERT(activity_type USING latin1) USING utf8mb4),
    store_scope = CONVERT(BINARY CONVERT(store_scope USING latin1) USING utf8mb4),
    time_text = CONVERT(BINARY CONVERT(time_text USING latin1) USING utf8mb4),
    status = CONVERT(BINARY CONVERT(status USING latin1) USING utf8mb4),
    rules = CONVERT(BINARY CONVERT(rules USING latin1) USING utf8mb4)
WHERE title LIKE '%å%'
   OR activity_type LIKE '%å%'
   OR store_scope LIKE '%å%'
   OR time_text LIKE '%å%'
   OR status LIKE '%å%'
   OR rules LIKE '%å%';

UPDATE order_review
SET content = CONVERT(BINARY CONVERT(content USING latin1) USING utf8mb4),
    audit_status = CONVERT(BINARY CONVERT(audit_status USING latin1) USING utf8mb4),
    reply = CONVERT(BINARY CONVERT(reply USING latin1) USING utf8mb4)
WHERE content LIKE '%å%'
   OR audit_status LIKE '%å%'
   OR reply LIKE '%å%';

UPDATE operation_log
SET operator = CONVERT(BINARY CONVERT(operator USING latin1) USING utf8mb4),
    module_name = CONVERT(BINARY CONVERT(module_name USING latin1) USING utf8mb4),
    action_text = CONVERT(BINARY CONVERT(action_text USING latin1) USING utf8mb4)
WHERE operator LIKE '%å%'
   OR module_name LIKE '%å%'
   OR action_text LIKE '%å%';

SELECT id, name, sport FROM venue ORDER BY id LIMIT 5;
SELECT id, nickname, level_name FROM user_profile ORDER BY id LIMIT 5;
