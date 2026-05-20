# 伊幺体育 Vue3 管理后台

这是体育馆运营管理系统 B 端管理后台，技术栈为 Vue3、Vite、Element Plus、Pinia、Vue Router、Axios、ECharts。当前页面已按真实接口优先设计，`src/data/mock.js` 只保留空结构，接口失败时不再展示假业务数据。

## 本地开发

```powershell
cd C:\Users\yiyao\Desktop\体育馆运营管理系统\admin-web
npm install
npm run dev
```

默认端口 `5174`，Vite 将 `/api` 代理到 `http://localhost:8080`。

## Docker 运行

从项目根目录执行：

```powershell
docker compose up -d --build admin-web nginx
```

nginx 会托管后台静态资源，并把 `/api/` 反向代理到 `gym-gateway:8080`。

## 默认账号

账号来自 MySQL `admin_account` 表：

- `admin / admin123`
- `manager / admin123`
- `staff / admin123`

后续应替换为 BCrypt 密码、真实角色权限和操作日志审计。
