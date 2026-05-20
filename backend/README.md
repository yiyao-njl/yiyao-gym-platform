# 伊幺体育后端服务

后端已从“接口骨架”推进到真实数据互联阶段：各业务服务通过 `gym-common` 中的共享 JDBC 数据仓库访问 MySQL，Redis 用于验证码和预约短锁，RabbitMQ 保留订单/支付/通知异步事件能力，网关统一承载 `/api/**` 入口。

## 模块

| Module | Port | Responsibility |
|---|---:|---|
| `gym-gateway` | 8080 | 统一入口、路由、CORS、TraceId、基础鉴权 |
| `gym-auth-service` | 8101 | 小程序一键登录、短信登录、管理员登录、JWT |
| `gym-user-service` | 8102 | 用户资料、积分记录 |
| `gym-venue-service` | 8103 | 城市、门店、场地、套餐、时段与预约校验 |
| `gym-order-service` | 8104 | 购物车、订单、Redis 预约短锁、MySQL 占用写入 |
| `gym-payment-service` | 8105 | 支付单、支付流水、开发期模拟支付成功 |
| `gym-marketing-service` | 8106 | 首页、活动、优惠券 |
| `gym-member-service` | 8107 | 会员权益、用户列表 |
| `gym-review-service` | 8108 | 评价提交与管理 |
| `gym-message-service` | 8109 | RabbitMQ 拓扑与消息发送 |
| `gym-statistics-service` | 8110 | 经营看板统计 |

## 本地 Docker 启动

从项目根目录运行：

```powershell
cd C:\Users\yiyao\Desktop\体育馆运营管理系统
copy .env.example .env
docker compose up -d --build
```

访问地址：

- 管理后台：`http://localhost/`
- API 网关：`http://localhost/api/app/home`
- RabbitMQ 控制台：`http://localhost:15672`，账号 `gym / gym`
- Nacos 控制台：`http://localhost:8848/nacos`

MySQL 首次启动会执行 `backend/scripts/init.sql`，创建真实业务表和种子数据。默认后台账号为 `admin / admin123`、`manager / admin123`、`staff / admin123`。

## 开发运行

也可以只启动基础设施，再本地启动单个服务：

```powershell
cd backend
docker compose up -d mysql redis rabbitmq nacos
mvn -pl gym-auth-service -am spring-boot:run
```

网关本地默认路由到 `localhost:8101-8110`；Docker Compose 中通过环境变量改为容器服务名。

## 当前边界

- MySQL 是业务事实源；`DemoDataStore` 仅保留为旧测试/兼容素材，不应作为运行时接口数据源。
- 开发期支付仍为 mock 通道，但会真实写入 `payment_record` 并推动订单状态变化。
- 未配置真实微信支付、短信供应商和微信开放平台密钥时，登录/短信/支付使用可替换开发通道。
- Swagger/OpenAPI 依赖已接入各 MVC 服务，服务启动后访问对应 `/swagger-ui.html`。
