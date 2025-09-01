# Homeland - Service Management Dashboard

一个基于React + Material UI + Next.js的现代化服务管理仪表板，通过Next.js API后端集成watchdog-grpc-sdk来实现服务的增删改查功能。

## 架构

本应用采用统一的Next.js全栈架构：

### 统一架构 (Next.js 全栈)
- **前端**: Next.js Pages + React 18 + Material UI
- **后端**: Next.js API Routes + `watchdog-grpc-sdk`
- **状态管理**: Zustand
- **路由**: Next.js 路由系统
- **服务通信**: Next.js API Routes作为gRPC客户端
- **语言**: TypeScript
- **开发服务器**: Next.js (默认端口 3000)

### 架构优势
- **统一技术栈**: 一个Next.js服务器同时处理前端页面和API路由
- **浏览器兼容性**: gRPC-js在Node.js环境中运行，避免浏览器兼容性问题
- **简化部署**: 单一应用，减少运维复杂度
- **开发效率**: 统一的开发环境和构建流程
- **数据解析**: 智能解析protobuf和标准JSON格式

## 特性

- 🚀 **统一架构** - Next.js全栈的现代化架构
- 🎨 **Material UI设计** - 美观且响应式的用户界面
- 📊 **实时监控** - 通过API集成watchdog-grpc-sdk进行服务监控
- 🔧 **完整CRUD** - 支持服务的增删改查操作
- 📱 **响应式设计** - 支持各种设备尺寸
- 🎯 **TypeScript支持** - 完整的类型定义
- 🔗 **gRPC集成** - 无缝连接gRPC服务器

## 技术栈

### 前端
- React 18 + TypeScript
- Material UI (MUI)
- Vite
- Zustand (状态管理)
- React Router DOM

### 后端
- Next.js API Routes
- watchdog-grpc-sdk
- TypeScript

### 开发工具
- ESLint + TypeScript
- Concurrently (并发运行)
- pnpm (包管理)

## 快速开始

### 前置要求
- Node.js 18.18.0+
- pnpm 8.0.0+
- 运行中的Watchdog gRPC服务器 (默认: localhost:50051)

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
# 启动开发服务器
pnpm dev
```

### 构建生产版本

```bash
# 构建应用
pnpm build
```

### 启动生产服务器

```bash
pnpm start
```

### Docker 部署

```bash
# 使用默认端口 (30010:30010, 50051:50051)
./docker-deploy.sh

# 使用自定义端口
EXPOSE_PORT=30011 WATCHDOG_EXPOSE_PORT=50052 ./docker-deploy.sh
```

## 项目结构

```
src/                    # React前端源码
├── components/         # React组件
│   ├── Header.tsx     # 导航头部
│   ├── Dashboard.tsx  # 仪表板页面
│   ├── ServiceManager.tsx  # 服务管理页面
│   └── ServiceForm.tsx     # 服务表单组件
├── stores/            # Zustand状态管理
│   └── serviceStore.ts    # 服务状态存储
├── App.tsx            # 主应用组件
├── main.tsx           # 应用入口点
└── index.css          # 全局样式

pages/                 # Next.js API路由
├── api/
│   ├── health.ts      # 健康检查端点
│   └── services/      # 服务管理API
│       ├── index.ts   # 列表/创建服务
│       └── [serviceId].ts  # 删除/更新服务

vite.config.ts         # Vite配置
next.config.js         # Next.js配置
package.json          # 项目依赖和脚本
```

## API端点

### 健康检查
- `GET /api/health` - 检查Watchdog服务器状态

### 服务管理
- `GET /api/services` - 获取服务列表
- `POST /api/services` - 注册新服务
- `DELETE /api/services/[serviceId]` - 注销服务
- `PUT /api/services/[serviceId]` - 更新服务状态

## 功能说明

### 仪表板 (Dashboard)
- 显示服务统计信息（总数、健康、警告、不健康）
- 最近注册的服务列表
- 实时刷新功能

### 服务管理 (Service Management)
- 服务列表展示（使用Material UI DataGrid）
- 添加新服务
- 编辑现有服务
- 删除服务
- API服务器配置设置

### 支持的服务类型
- HTTP服务 (SERVICE_TYPE_HTTP = 1)
- gRPC服务 (SERVICE_TYPE_GRPC = 2)
- 数据库 (SERVICE_TYPE_DATABASE = 3)
- 缓存 (SERVICE_TYPE_CACHE = 4)
- 队列 (SERVICE_TYPE_QUEUE = 5)
- 存储 (SERVICE_TYPE_STORAGE = 6)
- 外部API (SERVICE_TYPE_EXTERNAL_API = 7)
- 微服务 (SERVICE_TYPE_MICROSERVICE = 8)
- 其他 (SERVICE_TYPE_OTHER = 9)

## 配置

### 环境变量

可以设置以下环境变量来配置Watchdog gRPC服务器连接：

```env
WATCHDOG_HOST=localhost
WATCHDOG_PORT=50051
```

### 前端配置

前端通过设置对话框配置API服务器地址：
- 默认API Base URL: http://localhost:30010/api

## 开发指南

### 添加新API端点

1. 在 `pages/api/` 目录下创建新的API路由文件
2. 使用 `watchdog-grpc-sdk` 与gRPC服务器通信
3. 返回JSON响应给前端

### 添加新前端组件

1. 在 `src/components/` 目录下创建新组件
2. 使用TypeScript和Material UI组件
3. 通过HTTP调用API端点
4. 使用Zustand管理状态

### 状态管理

前端使用Zustand进行状态管理，所有服务相关的状态都在 `serviceStore.ts` 中定义，通过HTTP API与后端通信。

## 部署

### Docker部署

项目包含Dockerfile，支持构建和运行容器化应用：

```bash
# 构建镜像
docker build -t homeland .

# 运行容器
docker run -p 30010:30010 -p 50051:50051 homeland
```

### 分离部署

#### 前端静态部署
```bash
pnpm build:client
# 将 dist/ 目录部署到静态文件服务器
```

#### API服务器部署
```bash
pnpm build:api
pnpm start:api
```

## 测试API

### 测试健康检查
```bash
curl http://localhost:30010/api/health
```

### 测试服务注册
```bash
curl -X POST http://localhost:30010/api/services \
  -H "Content-Type: application/json" \
  -d '{"name":"test-service","endpoint":"http://localhost:8080","type":1}'
```

### 测试服务列表
```bash
curl http://localhost:30010/api/services
```

## 故障排除

### 常见问题

1. **gRPC连接失败**
   - 检查Watchdog gRPC服务器是否运行在 localhost:50051
   - 验证环境变量 WATCHDOG_HOST 和 WATCHDOG_PORT
   - 确保网络连接正常

2. **API服务器无法启动**
   - 检查端口30010是否被占用
   - 验证Next.js依赖是否正确安装
   - 查看Next.js错误日志

3. **前端无法连接API**
   - 确认API服务器在 http://localhost:30010 运行
   - 检查前端API配置是否正确
   - 验证CORS设置

4. **构建错误**
   - 检查TypeScript类型错误
   - 验证所有依赖是否正确安装
   - 清除构建缓存: `pnpm install --frozen-lockfile`

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建应用
pnpm build

# 启动生产服务器
pnpm start

# 代码检查
pnpm lint

# 预览前端构建
pnpm preview
```

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT License