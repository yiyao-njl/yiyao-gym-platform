# 体育馆运营管理系统项目说明

## 1. 项目概览

本项目是“体育馆运营管理系统”，当前已经从早期小程序 mock 演示推进到“三端真实数据互联 + Docker 本地部署”阶段，仓库内主要包含：

- `伊幺体育/`：C 端原生微信小程序，面向普通用户，负责首页、门店选择、到店开场、预约开场、场地详情、购物车、支付、订单、会员、优惠券、活动、登录和个人中心。
- `admin-web/`：B 端 Vue3 管理后台，面向超级管理员、店长、员工，负责看板、门店场地、订单、支付退款、用户会员、营销、评价、统计和系统管理。
- `backend/`：Spring Boot 3.3.5 + Spring Cloud 2023.0.3 + Java 17 的 Maven 多模块后端，负责统一网关、认证、用户、场地、订单、支付、营销、会员、评价、消息和统计服务。
- `deploy/`：部署配置，目前包含 nginx 反向代理配置。
- 根目录 `docker-compose.yml`：编排 MySQL、Redis、RabbitMQ、Nacos、各后端服务、后台前端和 nginx。

后续接手请以本 `AGENTS.md`、`AGENT.md` 和当前目录实际文件为准。旧说明里“后端只是骨架”“后台不存在”“业务仍以 mock 为主”的内容已经不再准确。

## 2. 当前目录结构

```text
.
├── AGENT.md
├── AGENTS.md
├── .env
├── .env.example
├── docker-compose.yml
├── docker-compose.local-images.yml
├── 体育馆运营管理后台系统需求文档.md
├── admin-web/
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── README.md
│   └── src/
├── backend/
│   ├── pom.xml
│   ├── Dockerfile
│   ├── README.md
│   ├── scripts/init.sql
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
├── deploy/
│   └── nginx/default.conf
└── 伊幺体育/
    ├── app.js
    ├── app.json
    ├── app.wxss
    ├── project.config.json
    ├── 体育馆运营管理小程序-前端需求文档.md
    ├── 体育馆运营管理小程序-前端开发文档.md
    ├── components/
    ├── images/
    ├── pages/
    ├── utils/
    └── docs/backend/
```

## 3. C 端微信小程序

- 小程序根目录是 `伊幺体育/`，技术栈是原生微信小程序，不是 Taro、uni-app、Vue 或 React。
- `app.json` 启用云开发 `cloud: true`，使用自定义导航 `navigationStyle: "custom"`，底部 TabBar 为：首页、开场、订单、我的。
- `app.js` 初始化云环境 `cloud1-6g1zde6bb1996733`。
- `project.config.json` 中 AppID 为 `wxd13b3906dfa6d35b`，基础库版本为 `3.5.8`。
- `utils/request.js` 是当前后端请求封装，默认 baseURL 为 `http://localhost:8080`，也可通过微信 storage key `gym-api-base-url` 覆盖。
- `utils/api.js` 已封装小程序侧接口：短信登录、微信一键登录、首页、城市、门店、场地、预约校验、创建订单、创建支付、模拟支付成功和订单列表。
- `utils/mockData.js` 只应作为 UI 兜底素材逐步淘汰，新增业务必须优先接 `utils/api.js` 和后端接口。
- `utils/store.js` 使用微信 storage key `gym-front-state` 保存登录态、用户、当前城市、当前门店、开场模式、购物车、订单和经验值等状态。改状态结构时要做旧 storage 兼容。
- `utils/timeSlots.js` 是营业时间、时间刻度、跨 24 点显示、使用中/已预定/可预定判断的核心，不要在页面里另写一套时间规则。
- `utils/cartValidation.js` 负责购物车价格试算、优惠计算、数量合计、时段有效性校验，并能组装后端订单请求结构。

当前页面包括：

- `index`：首页，包含轮播、用户信息、到店开场/预约开场入口、推荐场地和活动。
- `open`：核心开场页，支持到店开场和预约开场；包含门店信息、门店图、日期选择、运动筛选、场地列表、时间刻度、底部购物车条、已选购场次弹层和优惠明细弹层。
- `venue`：场地详情页，展示场地大图、时间刻度、套餐规格、自定义开场时间、价格明细；支持加入购物车和立即开场。
- `cart`：购物车页，支持勾选、删除和结算。
- `payment`：模拟支付页，做购物车校验、优惠试算、创建订单、模拟支付成功/失败。
- `orders`、`orderDetail`：订单列表和订单详情。
- `mine`、`login`、`phoneLogin`、`accountManage`、`switchAccount`、`logout`：个人中心和登录账号相关页面。
- `profileEdit`、`expDetail`、`city`、`store`、`member`、`coupon`、`activity`：资料、经验值、城市门店、会员、优惠券、活动详情等页面。

重要前端业务约束：

- 首页入口会设置 `store.openMode`，再跳转到 `pages/open/open`。
- 到店开场使用今天当前时间之后的可用时段；预约开场显示未来 7 天日期，并按所选日期计算时段。
- 同一门店同一场地加入购物车时会替换旧项，购物车项包含 `quantity` 和 `checked`。
- 订单与场地占用在本地仍有模拟闭环：到店开场支付成功后写入 `using`，预约开场先写入 `booked`，到开始时间后展示层转为 `using`。
- 真实上线时价格、优惠、场地占用、订单状态和支付结果都必须以后端为准，不能依赖本地 storage 裁决。
- 修改小程序页面时必须同步维护 `app.json` 的 `pages` 数组。
- `app.json` 曾因 UTF-8 BOM 导致微信开发者工具报 `Unexpected token ... position 0`，后续编辑配置文件务必保持 UTF-8 without BOM。

## 4. B 端管理后台

- 管理后台目录是 `admin-web/`，技术栈为 Vue3、Vite、Element Plus、Pinia、Vue Router、Axios、ECharts。
- 本地开发命令：

```powershell
cd C:\Users\yiyao\Desktop\体育馆运营管理系统\admin-web
npm install
npm run dev
```

- Vite 默认端口为 `5174`，`vite.config.js` 将 `/api` 代理到 `http://localhost:8080`。
- `src/api/request.js` 是 Axios 统一封装，baseURL 为 `/api`，会注入 `Authorization: Bearer <token>` 和 `X-Client-Type: admin-web`，统一处理 `ApiResponse.code` 和 401。
- `src/api/modules.js` 封装后台接口：登录、当前管理员、看板、门店、场地、场地类型、套餐、订单、退款审核、支付、优惠券、活动、评价、账号、用户、会员、日志等。
- `src/stores/auth.js` 管理后台登录态；`src/router/index.js` 用路由守卫控制未登录跳转 `/login`。
- 当前路由页面包括：首页看板、门店场地、订单管理、支付退款、用户会员、营销管理、评价管理、数据统计、系统管理。
- `src/data/mock.js` 已清空为结构占位，接口失败不再展示假业务数据。新增后台功能不要恢复假业务 mock。
- 默认账号来自 MySQL `admin_account` 表：`admin / admin123`、`manager / admin123`、`staff / admin123`。后续应替换为 BCrypt 密码、真实角色权限和操作日志审计。

后台开发约束：

- 表格、筛选、详情抽屉/弹窗、状态标签优先使用 Element Plus 组件和现有页面风格。
- 统计图表使用 ECharts，复用 `src/utils/useChart.js`。
- 金额、订单状态、退款状态、支付状态只能展示后端结果，前端不可自行推导最终业务状态。
- 运营配置类数据建议使用启用/停用状态，不要物理删除历史业务数据。
- 管理端危险操作必须二次确认，并由后端记录操作日志。

## 5. 后端服务

`backend/` 是 Spring Boot 3.3.5 + Spring Cloud 2023.0.3 + Java 17 的 Maven 多模块项目，父工程为 `backend/pom.xml`。

模块与端口：

- `gym-common`：统一响应、分页、错误码、异常、TraceId、JWT 工具、状态枚举、共享 JDBC 数据仓库。
- `gym-gateway`：网关，端口 8080，负责 `/api/**` 统一入口、CORS、TraceId、基础鉴权和路由。
- `gym-auth-service`：认证服务，端口 8101。
- `gym-user-service`：用户资料和积分，端口 8102。
- `gym-venue-service`：城市、门店、场地、套餐、时段和预约校验，端口 8103。
- `gym-order-service`：购物车、订单、取消、退款申请、Redis 预约短锁、MySQL 占用写入，端口 8104。
- `gym-payment-service`：支付单、支付状态、开发期模拟支付成功、支付/退款回调，端口 8105。
- `gym-marketing-service`：首页、活动、优惠券，端口 8106。
- `gym-member-service`：会员权益、用户和会员管理，端口 8107。
- `gym-review-service`：评价提交和管理，端口 8108。
- `gym-message-service`：RabbitMQ 拓扑、事件 DTO、消息发送封装，端口 8109。
- `gym-statistics-service`：经营看板，端口 8110。

当前实现状态：

- `backend/scripts/init.sql` 是当前可执行数据库初始化脚本，包含城市、门店、场地、套餐、用户、管理员、订单、支付、活动、优惠券、会员、评价、统计等表和种子数据。
- `gym-common/src/main/java/com/yiyao/gym/common/data/CommercialDataRepository.java` 是当前核心运行时数据访问入口，各业务服务通过它访问 MySQL。
- `DemoDataStore` 仅可作为旧兼容/测试素材，不能作为新增运行时业务数据源。
- Redis 已用于短信验证码和订单创建时的场地预约短锁；订单落库通过 `venue_occupancy` 唯一约束与应用层重叠校验兜底。
- RabbitMQ 和 Nacos 已纳入容器基础设施；RabbitMQ 拓扑由 `gym-message-service` 维护，Nacos 当前作为服务治理基础设施保留。
- 网关本地默认路由到 `localhost:8101-8110`，Docker Compose 中通过环境变量改为容器服务名；`application-nacos.yml` 保留 `lb://service-name` 路由方案。
- Swagger/OpenAPI 依赖已接入 MVC 服务，服务启动后可访问对应 `/swagger-ui.html`。

主要接口形态：

- 认证：`/api/auth/app/wechat-login`、`/api/auth/sms/send`、`/api/auth/sms/login`、`/api/auth/admin/login`、`/api/auth/token/refresh`、`/api/auth/logout`。
- 小程序首页与营销：`/api/app/home`、`/api/app/banners`、`/api/app/activities`、`/api/app/coupons`。
- 小程序用户：`/api/app/users/me`、`/api/app/users/me/summary`、`/api/app/users/me/points`。
- 小程序门店场地：`/api/app/cities`、`/api/app/stores`、`/api/app/venues`、`/api/app/venues/{venueId}/slots`、`/api/app/reservations/check`。
- 小程序购物车订单：`/api/app/cart/items`、`/api/app/cart/checkout-preview`、`/api/app/orders`、`/api/app/orders/{orderId}/cancel`、`/api/app/orders/{orderId}/refund`。
- 小程序支付：`/api/app/payments`、`/api/app/payments/{paymentNo}`、`/api/app/payments/mock-success`、`/api/app/payments/wechat/callback`、`/api/app/payments/refund/callback`。
- 小程序会员评价：`/api/app/members/benefits`、`/api/app/members/orders`、`/api/app/orders/{orderId}/review`、`/api/app/venues/{venueId}/reviews`。
- 后台：`/api/admin/me`、`/api/admin/statistics/dashboard`、`/api/admin/stores`、`/api/admin/venues`、`/api/admin/venue-types`、`/api/admin/venue-packages`、`/api/admin/orders`、`/api/admin/payments`、`/api/admin/users`、`/api/admin/members`、`/api/admin/coupons`、`/api/admin/activities`、`/api/admin/reviews`、`/api/admin/accounts`、`/api/admin/logs`。
- 内部消息：`/internal/messages/mock-payment-success`。

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

分页数据放在 `data` 中，字段包括 `pageNo`、`pageSize`、`total`、`totalPages`、`records`。

## 6. 运行方式

推荐从项目根目录启动完整链路：

```powershell
cd C:\Users\yiyao\Desktop\体育馆运营管理系统
copy .env.example .env
docker compose up -d --build
```

访问地址：

- 管理后台：`http://localhost/`
- API 网关示例：`http://localhost/api/app/home`
- RabbitMQ 控制台：`http://localhost:15672`，账号 `gym / gym`
- Nacos 控制台：`http://localhost:8848/nacos`

也可以只启动基础设施，再本地启动单个后端服务：

```powershell
cd C:\Users\yiyao\Desktop\体育馆运营管理系统\backend
docker compose up -d mysql redis rabbitmq nacos
mvn -pl gym-auth-service -am spring-boot:run
```

注意：根目录 `docker-compose.yml` 是当前完整三端链路编排；`backend/docker-compose.yml` 更偏后端基础设施/局部开发语境，使用前以当前文件内容为准。

## 7. 文档地图

- `AGENTS.md`：当前 AI/开发者接手总说明。
- `AGENT.md`：另一份接手说明，内容与本文件互为补充。
- `伊幺体育/体育馆运营管理小程序-前端需求文档.md`：C 端小程序需求和实现说明。
- `伊幺体育/体育馆运营管理小程序-前端开发文档.md`：C 端小程序开发说明。
- `体育馆运营管理后台系统需求文档.md`：B 端后台需求和实现说明。
- `admin-web/体育馆运营管理后台-前端开发文档.md`：B 端后台开发说明。
- `伊幺体育/docs/backend/体育馆运营管理后端开发文档.md`：后端服务开发说明。
- `伊幺体育/docs/backend/后端开发设计文档.md`：后端总体设计与当前实现边界。
- `伊幺体育/docs/backend/微服务架构设计文档.md`：服务拆分和职责边界。
- `伊幺体育/docs/backend/前后端接口联调设计文档.md`：接口规范和接口清单。
- `伊幺体育/docs/backend/MySQL数据库设计文档.md`：数据库表设计建议。
- `伊幺体育/docs/backend/Redis缓存与并发控制设计文档.md`：缓存、预约锁、并发控制设计。
- `伊幺体育/docs/backend/RabbitMQ异步消息设计文档.md`：消息拓扑和异步事件设计。
- `伊幺体育/docs/backend/支付与订单流程设计文档.md`：订单、支付、退款状态流转。
- `伊幺体育/docs/backend/登录认证与权限设计文档.md`：C 端和 B 端认证权限。
- `伊幺体育/docs/backend/容器化部署与运维设计文档.md`：部署运维设计。
- `伊幺体育/docs/backend/测试验收与AI实现约束文档.md`：测试验收和 AI 实现边界。

## 8. 关键业务约束

- MySQL 是当前业务事实源，价格、优惠、库存、支付结果、订单状态、场地占用必须以后端为准。
- 场地预约/开场必须由后端做并发控制，当前已有 Redis 短锁 + MySQL `venue_occupancy` 约束兜底，后续生产增强应补充分布式锁续期、超时关单和更完整的幂等处理。
- 支付回调必须验签、幂等，并记录支付流水；当前开发期支付为 mock 通道，但仍会真实写入 `payment_record` 并推动订单状态变化。
- 订单状态流转不能只依赖前端本地 storage，订单服务应集中维护状态机。
- 优惠券、活动、会员、经验值已纳入后端数据库接口，前端不可再以本地 mock 作为业务事实。
- 后台管理端不应展示假业务数据；接口失败应显示空状态或错误提示。
- 管理后台关键操作必须写操作日志，权限需按超级管理员、店长、员工逐步细化。
- 生产环境必须替换 `.env` 中的开发密钥、默认账号、mock 支付开关、数据库密码和 JWT Secret。

## 9. 开发注意事项

- 当前工作区没有发现根目录 `.git` 目录，修改前建议先备份或初始化版本管理。
- Windows 终端读取中文时可能出现乱码，优先用 `Get-Content -Encoding UTF8`。
- 手工编辑文件时保持 UTF-8 without BOM，尤其是微信小程序 `app.json`。
- 小程序页面注册必须同步维护 `app.json` 的 `pages` 数组。
- 修改 `store.js` 状态结构时，要考虑旧 storage 数据兼容；必要时做兜底默认值。
- 修改订单、购物车或场地时间轴时，要同步检查小程序 `venueOccupations`、`cartValidation.js`、后端订单请求适配和预约到点转使用中的逻辑。
- 后端新增业务数据访问优先扩展明确的 Repository/Service 边界，不要把 SQL 散落到 Controller。
- 网关路由要遵守 Spring Cloud Gateway Path 规则，不要写 `/api/app/**/xxx` 这类 `**` 后继续追加路径的表达式。
- 后台新增接口时同步更新 `admin-web/src/api/modules.js`，并让页面处理 loading、空状态和错误状态。
- 不要提交或依赖 `node_modules/`、`dist/`、本机 `.env` 中的敏感配置作为业务事实。

## 10. 建议下一步

1. 从根目录执行 `copy .env.example .env`，再执行 `docker compose up -d --build`，验证 MySQL、Redis、RabbitMQ、Nacos、nginx、后端服务和后台前端。
2. 用微信开发者工具打开 `伊幺体育/`，将接口地址配置到网关，清缓存并重新编译。
3. 对小程序一键登录、首页、门店、开场、场地详情、支付、订单，以及后台订单/支付/统计进行一轮真实联调。
4. 后续如接入真实微信支付、短信供应商和微信开放平台密钥，应保持数据库流水、订单状态、回调幂等和 RabbitMQ 事件不变。
