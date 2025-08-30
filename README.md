# Homeland - Service Management Dashboard

一个基于React + Material UI的现代化服务管理仪表板，集成了watchdog-grpc-sdk来实现服务的增删改查功能。

## 特性

- 🚀 **纯SPA架构** - 使用Vite构建的现代React应用
- 🎨 **Material UI设计** - 美观且响应式的用户界面
- 📊 **实时监控** - 集成watchdog-grpc-sdk进行服务监控
- 🔧 **完整CRUD** - 支持服务的增删改查操作
- 📱 **响应式设计** - 支持各种设备尺寸
- 🎯 **TypeScript支持** - 完整的类型定义

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI组件库**: Material UI (MUI)
- **状态管理**: Zustand
- **路由**: React Router DOM
- **服务监控**: watchdog-grpc-sdk
- **代码质量**: ESLint + TypeScript

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

应用将在 http://localhost:4235 启动

### 构建生产版本

```bash
pnpm build
```

### 预览生产版本

```bash
pnpm preview
```

## 项目结构

```
src/
├── components/          # React组件
│   ├── Header.tsx      # 导航头部
│   ├── Dashboard.tsx   # 仪表板页面
│   ├── ServiceManager.tsx  # 服务管理页面
│   └── ServiceForm.tsx # 服务表单组件
├── stores/             # 状态管理
│   └── serviceStore.ts # 服务状态存储
├── App.tsx             # 主应用组件
├── main.tsx            # 应用入口点
└── index.css           # 全局样式
```

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
- 客户端配置设置

### 支持的服务类型
- HTTP服务
- gRPC服务
- 数据库
- 缓存
- 队列
- 存储
- 外部API
- 微服务
- 其他

## 配置

### Watchdog gRPC客户端配置

默认配置：
- Host: localhost
- Port: 50051

可以通过设置对话框修改这些配置。

### 环境变量

可以创建 `.env` 文件来配置环境变量：

```env
VITE_WATCHDOG_HOST=localhost
VITE_WATCHDOG_PORT=50051
```

## 开发指南

### 添加新组件

1. 在 `src/components/` 目录下创建新组件
2. 使用TypeScript和Material UI组件
3. 遵循现有的代码风格和命名约定

### 状态管理

使用Zustand进行状态管理，所有服务相关的状态都在 `serviceStore.ts` 中定义。

### 样式

使用Material UI的 `sx` 属性进行样式定制，遵循Material Design规范。

## 部署

### Docker部署

```bash
# 构建镜像
docker build -t homeland .

# 运行容器
docker run -p 4235:4235 homeland
```

### 静态部署

构建后的文件在 `dist/` 目录中，可以部署到任何静态文件服务器。

## 故障排除

### 常见问题

1. **gRPC连接失败**
   - 检查Watchdog服务器是否运行
   - 验证主机和端口配置
   - 确保网络连接正常

2. **依赖安装失败**
   - 清除node_modules并重新安装
   - 检查Node.js版本（需要18.18.0+）
   - 使用pnpm而不是npm

3. **构建错误**
   - 检查TypeScript类型错误
   - 验证所有依赖是否正确安装
   - 清除构建缓存

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT License
