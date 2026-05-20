# 体育馆运营管理系统接手说明

## 1. 项目概览

本项目是“体育馆运营管理系统”，当前由两部分组成：

- `伊幺体育/`：原生微信小程序前端，面向 C 端用户，已实现首页、门店选择、到店开场、预约开场、场地详情、购物车、模拟支付、订单、会员、优惠券、活动、经验值等页面和本地业务闭环。
- `backend/`：Spring Boot 3.3.5 + Spring Cloud 2023.0.3 + Java 17 的 Maven 多模块后端骨架，已按服务边界建立模块、应用入口、基础配置、统一响应、部分 Controller/DTO/Entity/Service/Mapper 和示例接口。

后续接手请以本文件、`AGENTS.md` 和当前目录实际文件为准；旧版本中关于后端缺失或仅为纯骨架的描述已不再适用。当前项目已进入“三端真实数据互联 + Docker 部署”阶段。

## 当前实现重点

- 根目录新增 `docker-compose.yml` 和 `.env.example`，用于编排 MySQL、Redis、RabbitMQ、Nacos、nginx、管理后台和所有后端服务。
- `backend/scripts/init.sql` 是当前可执行数据库初始化脚本，包含用户、管理员、门店、场地、套餐、订单、支付、营销、会员、评价、统计等表和种子数据。
- 后端核心运行时数据应通过 `gym-common/src/main/java/com/yiyao/gym/common/data/CommercialDataRepository.java` 访问 MySQL，避免新增业务继续依赖 `DemoDataStore`。
- 小程序和管理后台应以网关 `/api/**` 为统一入口，前端本地 storage 只保留 token、当前门店、临时 UI 状态和草稿。

## 2. 目录结构

```text
.
├── AGENT.md
├── AGENTS.md
├── backend/
│   ├── pom.xml
│   ├── docker-compose.yml
│   ├── README.md
│   ├── gym-common/
│   ├── gym-gateway/
│   ├── gym-auth-service/
│   ├── gym-user-service/
│   ├── gym-venue-service/
│   ├── gym-order-service/
│   ├── gym-payment-service/
│   ├── gym-marketing-service/
│   ├── gym-member-service/
│   ├── gym-review-service/
│   ├── gym-message-service/
│   └── gym-statistics-service/
└── 伊幺体育/
    ├── app.js
    ├── app.json
    ├── app.wxss
    ├── project.config.json
    ├── project.private.config.json
    ├── sitemap.json
    ├── 体育馆运营管理小程序-前端需求文档.md
    ├── cloudfunctions/
    ├── components/
    ├── docs/backend/
    ├── images/
    ├── pages/
    └── utils/
```

## 3. 前端技术与配置

- 前端是原生微信小程序，不是 Taro、uni-app、Vue 或 React。
- 小程序根目录是 `伊幺体育/`。
- `app.json` 使用自定义导航：`navigationStyle: "custom"`。
- `app.json` 启用云开发：`cloud: true`。
- `app.js` 初始化云环境：`cloud1-6g1zde6bb1996733`。
- `project.config.json` 中 AppID 为 `wxd13b3906dfa6d35b`，基础库版本为 `3.5.8`。
- 底部 TabBar 为：首页、开场、订单、我的。
- `app.json` 曾因 UTF-8 BOM 导致微信开发者工具报 `Unexpected token ... position 0`，后续编辑配置文件要保持 UTF-8 without BOM。

## 4. 前端页面现状

`伊幺体育/pages/` 当前包含：

- `index`：首页，包含轮播、用户信息、到店开场/预约开场入口、推荐场地和活动。
- `open`：核心开场页，支持到店开场和预约开场；包含门店信息、门店图、日期选择、运动筛选、场地列表、时间刻度、底部购物车条、已选购场次弹层和优惠明细弹层。
- `venue`：场地详情页，展示场地大图、时间刻度、套餐规格、自定义开场时间、价格明细；支持加入购物车和立即开场。
- `cart`：购物车页，支持勾选、删除和结算。
- `payment`：模拟支付页，做购物车校验、优惠试算、创建订单、模拟支付成功/失败。
- `orders`：订单页，分为预约订单和开场订单；预约订单到开始时间后会在展示层流入开场订单。
- `orderDetail`：订单详情页。
- `mine`：我的页面，包含模拟登录、用户信息、会员/优惠券/订单入口等。
- `profileEdit`：用户资料编辑页。
- `expDetail`：经验值明细页。
- `city`：城市选择页。
- `store`：门店选择页。
- `member`：会员权益页。
- `coupon`：优惠券页。
- `activity`：活动详情页。

## 5. 前端工具与状态

主要工具位于 `伊幺体育/utils/`：

- `mockData.js`：本地模拟数据，包含城市、门店、场地、套餐、时段、活动、优惠券、用户、经验值等。
- `store.js`：本地状态管理，使用微信 storage key `gym-front-state`。
- `timeSlots.js`：场地营业时间、时间刻度、使用中/已预定/可预定状态、开始时间、结束时间和跨 24 点显示规则。
- `cartValidation.js`：购物车价格试算、数量合计、优惠计算、时段有效性校验。
- `mapDistance.js`、`mapConfig.js`：定位和距离计算相关逻辑。
- `cloudStorageFileLinkUtils.js`：云存储 fileID 转临时链接，失败时可走云函数兜底。
- `queryDomProperty.js`、`throttle.js`：页面辅助工具。

`store.js` 当前保存：

- 登录状态和用户信息。
- 当前城市、当前门店、定位信息。
- 当前开场模式：`walkIn` 或 `reservation`。
- 购物车，购物车项包含 `quantity` 和 `checked`，同一门店同一场地加入购物车时会替换旧项。
- 订单。
- 经验值记录。

## 6. 前端核心业务流

### 到店开场与预约开场

1. 首页入口设置 `store.openMode`。
2. 跳转到 `pages/open/open`。
3. 到店开场模式使用今天当前时间之后的可用时段。
4. 预约开场模式显示未来 7 天日期，并按所选日期计算时段。
5. 用户可在列表直接加入购物车，或进入场地详情选择套餐。

### 开场页购物车弹层

- 底部购物车条展示场次数量、预估价、原价和优惠入口。
- 已选购场次弹层参考茶饮类小程序购物车样式：标题、勾选圆点、清空按钮、场次图片、场次信息、单价、数量加减。
- 数量会影响底部角标、预估金额、优惠明细、购物车页、支付页和订单数量展示。
- 优惠明细弹层展示“场次合计、场次总价、优惠合计、优惠规则”，打开弹层时灰色蒙层覆盖页面固定头部、筛选栏和列表。

### 场地详情

- 时间刻度使用 `timeSlots.js` 统一计算。
- 每行最多显示 12 个小时，最多显示 24 个小时。
- 当总刻度数超过 12 时，详情页刻度使用 12 等分固定宽度，保证第二行与第一行对齐；当总刻度数不超过 12 时，保持原本自适应铺满。
- 固定套餐按套餐时长自动确定开始/结束时间。
- 自定义开场时间属于套餐单选项，选中后显示开始/结束时间选择。
- 自定义开始时间使用自定义 `picker-view` 弹窗，保留 1 分钟刻度滑动选择；弹窗顶部有取消、左右双箭头、确定。左右箭头是透明文本按钮，每次按 30 分钟跳转，超过范围或目标不可选时隐藏对应方向。
- 确认开始时间时会校验该分钟不能落在使用中或已预定区间内，并重新生成结束时间选项。
- 页面会定时刷新可用性，避免过期开始时间继续下单。

### 购物车与支付

- `open` 和 `venue` 通过 `store.addCart()` 写入购物车。
- 购物车和支付页会调用 `cartValidation.js` 校验场地、时间和占用状态。
- 价格计算会按 `quantity` 乘以单价和原价，再计算套餐优惠与优惠券抵扣。
- 支付页目前是模拟支付：创建订单、标记已支付、移除购物车、增加经验值。

### 订单

- 订单保存在本地 storage。
- 创建订单时，`mode === 'reservation'` 会成为 `预约订单`，否则为 `开场订单`。
- 订单页展示时会动态计算有效类型：
  - 未来开始的预约订单显示在“预约订单”。
  - 到点或已过开始时间的预约订单显示在“开场订单”。
  - 现场开场和历史订单显示在“开场订单”。
- 支持查看详情、取消、退款申请、再次预约。

## 7. 后端技术与模块

`backend/` 是 Spring Boot 3.3.5 + Spring Cloud 2023.0.3 + Java 17 的 Maven 多模块项目。

父工程：`backend/pom.xml`

模块：

- `gym-common`：统一响应、分页、错误码、枚举、TraceId、JWT 工具。
- `gym-gateway`：网关，端口 8080，负责 `/api/**` 统一入口、CORS、TraceId、基础鉴权和路由。
- `gym-auth-service`：认证服务，端口 8101。
- `gym-user-service`：用户资料和我的页面能力，端口 8102。
- `gym-venue-service`：城市、门店、场地、时段和预约校验，端口 8103。
- `gym-order-service`：购物车、订单、取消、退款申请，端口 8104。
- `gym-payment-service`：支付单、支付状态、支付/退款回调，端口 8105。
- `gym-marketing-service`：首页、活动、优惠券，端口 8106。
- `gym-member-service`：会员权益和会员订单，端口 8107。
- `gym-review-service`：评价提交和管理，端口 8108。
- `gym-message-service`：RabbitMQ 拓扑、事件 DTO、消息发送封装，端口 8109。
- `gym-statistics-service`：经营看板，端口 8110。

基础设施通过 `backend/docker-compose.yml` 提供：

- MySQL 8.3
- Redis 7.2
- RabbitMQ 3.13 management
- Nacos 2.3.2

## 8. 后端接口与实现状态

当前后端已存在应用入口和示例 Controller，目标是“可编译、可启动、接口结构稳定”，复杂业务仍多为示例或 Service 边界中的占位实现。

已存在的主要接口形态：

- 认证：`/api/auth/app/wechat-login`、`/api/auth/admin/login`、`/api/auth/token/refresh`、`/api/auth/logout`。
- 首页与营销：`/api/app/home`、`/api/app/banners`、`/api/app/activities`、`/api/app/coupons`。
- 用户：`/api/app/users/me`、`/api/app/users/me/summary`、`/api/app/users/me/points`。
- 门店场地：`/api/app/cities`、`/api/app/stores`、`/api/app/venues`、`/api/app/venues/{venueId}/slots`、`/api/app/reservations/check`。
- 购物车订单：`/api/app/cart/items`、`/api/app/cart/checkout-preview`、`/api/app/orders`、`/api/app/orders/{orderId}/cancel`、`/api/app/orders/{orderId}/refund`。
- 支付：`/api/app/payments`、`/api/app/payments/{paymentNo}`、`/api/app/payments/wechat/callback`、`/api/app/payments/refund/callback`。
- 会员：`/api/app/members/benefits`、`/api/app/members/orders`。
- 评价：`/api/app/orders/{orderId}/review`、`/api/app/venues/{venueId}/reviews`、`/api/admin/reviews`。
- 消息：`/internal/messages/mock-payment-success`。
- 统计：`/api/admin/statistics/dashboard`。

统一成功响应形态：

```json
{
  "code": "SUCCESS",
  "message": "请求成功",
  "data": {},
  "detail": null,
  "traceId": "..."
}
```

分页数据放在 `data` 中，字段包括：

- `pageNo`
- `pageSize`
- `total`
- `totalPages`
- `records`

## 9. 后端运行方式

按 `backend/README.md`，应从根目录下的 `backend/` 进入后端工程：

```powershell
cd C:\Users\yiyao\Desktop\体育馆运营管理系统\backend
docker compose up -d mysql redis rabbitmq nacos
mvn clean test
mvn -pl gym-auth-service spring-boot:run
```

启动其他服务时替换 `-pl` 后的模块名。网关启动后示例入口为：

```text
http://localhost:8080/api/app/home
```

## 10. 文档地图

- `伊幺体育/体育馆运营管理小程序-前端需求文档.md`：C 端微信小程序需求和当前实现说明。
- `伊幺体育/docs/backend/后端开发设计文档.md`：后端总体设计与当前骨架状态。
- `伊幺体育/docs/backend/微服务架构设计文档.md`：服务拆分和职责边界。
- `伊幺体育/docs/backend/前后端接口联调设计文档.md`：接口规范和接口清单。
- `伊幺体育/docs/backend/MySQL数据库设计文档.md`：数据库表设计建议。
- `伊幺体育/docs/backend/Redis缓存与并发控制设计文档.md`：缓存、预约锁、并发控制设计。
- `伊幺体育/docs/backend/RabbitMQ异步消息设计文档.md`：消息拓扑和异步事件设计。
- `伊幺体育/docs/backend/支付与订单流程设计文档.md`：订单、支付、退款状态流转。
- `伊幺体育/docs/backend/登录认证与权限设计文档.md`：C 端和 B 端认证权限。
- `伊幺体育/docs/backend/容器化部署与运维设计文档.md`：部署运维设计。
- `伊幺体育/docs/backend/测试验收与AI实现约束文档.md`：测试验收和 AI 实现边界。

## 11. 重要业务约束

- 前端当前可模拟价格、优惠、订单和支付，但真实上线时价格、优惠、库存、支付结果、订单状态必须以后端为准。
- 场地预约/开场必须由后端做并发控制，设计文档建议 Redis 锁 + MySQL 约束兜底。
- 支付回调必须验签、幂等，并记录支付流水。
- 订单状态流转不能只依赖前端本地 storage。
- 优惠券、活动、会员、经验值当前多为本地模拟，接后端时要统一到服务端校验。
- 后端当前骨架接口返回不少示例数据，不能误认为已经具备生产级业务能力。

## 12. 开发注意事项

- 当前工作区没有发现根目录 `.git` 目录，修改前建议先备份或初始化版本管理。
- Windows 终端读取中文时可能出现乱码，优先用 `Get-Content -Encoding UTF8`。
- 手工编辑文件时保持 UTF-8 without BOM，尤其是 `app.json`。
- 微信小程序页面注册必须同步维护 `app.json` 的 `pages` 数组。
- 修改 `mockData.js` 字段时，要同步检查 `open`、`venue`、`payment`、`orders`、`mine` 等页面引用。
- 修改 `store.js` 状态结构时，要考虑旧 storage 数据兼容；必要时做兜底默认值。
- `timeSlots.js` 是当前时间刻度和可用性判断的核心，避免在页面里重复实现另一套时间规则。
- 后端模块已存在，不要再按旧说明把后端当成纯文档目录。
- 后端网关当前用 localhost 路由，接入 Nacos 后再切换为 `lb://service-name`。

## 13. 建议下一步

1. 用微信开发者工具打开 `伊幺体育/`，清缓存并重新编译。
2. 对首页、开场、场地详情、已选购场次、优惠明细、支付、订单进行一轮真实预览检查。
3. 为前端新增统一 request 层，逐步从 `mockData.js` 切换到后端接口。
4. 后端优先补齐认证、门店场地、预约锁、订单、支付等核心闭环。
5. 引入数据库迁移工具后再落地正式建表脚本，避免文档和可执行 SQL 脱节。
