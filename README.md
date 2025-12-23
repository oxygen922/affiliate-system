# 🚀 Affiliate Platform - 次级联盟营销平台

一个功能完整的次级联盟营销管理系统，支持从一级联盟获取Offer、灵活佣金分成、多角色管理。

## 📋 项目简介

本系统是一个连接上游联盟和下游推广者的次级联盟营销平台，支持：
- ✅ Offer管理与分发
- ✅ 灵活的佣金比例设置（支持80%、90%等自定义比例）
- ✅ 商家标签审核（黑名单需人工审核）
- ✅ 多端管理（管理后台、Publisher端、广告主端）
- ✅ 自动佣金结算

## 🏗️ 技术栈

### 后端
- Node.js + Express
- Sequelize ORM
- PostgreSQL
- JWT认证
- Winston日志

### 前端
- Vue 3 + TypeScript
- Vite
- Element Plus
- Pinia状态管理
- Vue Router
- Axios

### 部署
- Docker + Docker Compose
- Nginx反向代理

## 📁 项目结构

```
affiliate-platform/
├── backend/                    # 后端服务
├── frontend-admin/             # 管理后台（运营人员）
├── frontend-publisher/         # Publisher推广端
├── frontend-advertiser/        # 广告主端
├── docker/                     # Docker配置
├── docs/                       # 文档
└── README.md
```

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- PostgreSQL >= 12
- npm >= 8.0.0

### 安装依赖

```bash
# 后端
cd backend && npm install

# 前端（可选）
cd ../frontend-admin && npm install
cd ../frontend-publisher && npm install
cd ../frontend-advertiser && npm install
```

### 配置数据库

```bash
# 启动PostgreSQL（Docker）
cd docker
docker-compose up -d

# 运行数据库迁移
cd ../backend
npm run migrate
```

### 启动服务

```bash
# 后端
cd backend
npm run dev

# 管理后台
cd frontend-admin
npm run dev

# Publisher端
cd frontend-publisher
npm run dev

# 广告主端
cd frontend-advertiser
npm run dev
```

### 访问地址

- 管理后台：http://localhost:5173
- Publisher端：http://localhost:5174
- 广告主端：http://localhost:5175
- 后端API：http://localhost:3000

## 📚 功能模块

### 管理后台（/admin）
- Offer管理（CRUD、审核）
- Publisher管理（佣金比例设置）
- 数据统计分析
- 系统配置

### Publisher端（/publisher）
- 浏览Offer市场
- 生成推广链接
- 查看佣金收益
- 申请提现

### 广告主端（/advertiser）
- 提交Offer
- 查看推广效果
- 数据统计

## 🔐 用户角色

- **运营人员**：全部管理权限
- **Publisher**：推广Offer，获取佣金
- **广告主**：提交Offer，查看效果

## 💰 佣金计算逻辑

```
订单金额 × Offer佣金率 × Publisher分成比例 = 实际佣金

示例：
订单金额 = $100
Offer佣金率 = 10%
Publisher分成 = 90%
实际佣金 = 100 × 0.10 × 0.90 = $9
平台抽成 = $1
```

## 🏷️ 商家标签审核

- **黑名单商家**：需要人工审核
- **普通商家**：自动通过审核

## 📝 开发规范

- 后端遵循RESTful API规范
- 前端使用Vue 3 Composition API
- 代码注释使用中文
- 提交信息使用Conventional Commits

## 📄 许可证

MIT License

## 👥 作者

基于 affiliate-management-system SDK 改造

---

**老王出品，必属精品！** 💪
