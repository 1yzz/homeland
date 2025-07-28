# Homeland - 服务监控系统

Homeland 是一个基于 Next.js 的服务监控和管理系统，用于发现、监控和管理本机运行的各种服务。

## 🚀 功能特性

### 核心功能
- **服务发现**：自动扫描并发现本机运行的服务
- **服务管理**：添加、编辑、删除服务
- **状态监控**：实时显示服务运行状态
- **智能IP替换**：自动将localhost替换为实际IP地址，方便从其他设备访问
- **表格展示**：使用表格形式清晰展示服务信息
- **响应式设计**：支持桌面端和移动端

### 支持的服务类型
- **HTTP服务**：Web应用、API服务、微服务等
- **gRPC服务**：高性能RPC服务
- **Systemd服务**：系统服务管理
- **Supervisord服务**：进程管理服务
- **Docker容器**：Docker容器服务
- **数据库服务**：MySQL、PostgreSQL等
- **缓存服务**：Redis、Memcached等
- **自定义服务**：其他类型服务

### 技术栈
- **前端**：Next.js 15 + React 19 + TypeScript
- **样式**：Tailwind CSS + 深色模式支持
- **数据库**：MySQL + Prisma ORM
- **状态管理**：Zustand
- **开发工具**：Turbopack

## 📦 安装和运行

### 环境要求
- Node.js 18+
- MySQL 8.0+
- Linux/macOS/Windows

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd homeland
```

2. **安装依赖**
```bash
npm install
```

3. **配置数据库**
```bash
# 创建 .env 文件
cp .env.example .env

# 编辑 .env 文件，配置数据库连接
DATABASE_URL="mysql://username:password@localhost:3306/homeland"
```

4. **初始化数据库**
```bash
# 生成 Prisma 客户端
npx prisma generate

# 推送数据库架构
npx prisma db push

# 或者使用迁移（推荐）
npx prisma migrate dev --name init
```

5. **启动开发服务器**
```bash
npm run dev
```

6. **访问应用**
打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 🛠️ 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint

# 数据库操作
npx prisma generate          # 生成 Prisma 客户端
npx prisma db push          # 推送架构变更到数据库
npx prisma migrate dev      # 创建并应用新迁移
npx prisma studio          # 打开 Prisma Studio 查看数据库
```

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── admin/         # 管理API
│   │   ├── services/      # 服务API
│   │   └── system/        # 系统API
│   ├── page.tsx           # 首页
│   ├── services/          # 服务管理页面
│   └── settings/          # 设置页面
├── components/            # React 组件
│   ├── admin/            # 管理组件
│   ├── ui/               # UI 组件
│   └── Sidebar.tsx       # 侧边栏
├── lib/                  # 工具库
│   ├── db.ts            # 数据库连接
│   ├── store.ts         # 全局状态管理
│   └── serviceDiscovery.ts # 服务发现
└── prisma/              # 数据库架构
    └── schema.prisma    # Prisma 架构定义
```

## 🔧 配置说明

### 环境变量
```env
# 数据库连接
DATABASE_URL="mysql://username:password@localhost:3306/homeland"

# 其他配置
NODE_ENV=development
```

### 系统设置
- **自动IP替换**：在设置页面可以开启/关闭自动将localhost替换为实际IP的功能
- **服务扫描**：支持手动扫描和自动发现服务
- **状态监控**：实时监控服务运行状态

## 🎯 主要功能

### 服务管理
- 查看所有服务列表
- 添加新服务
- 编辑服务信息
- 删除服务
- 服务状态监控

### 智能IP替换
- 自动检测本机IP地址
- 访问服务时自动替换localhost为实际IP
- 支持多种URL格式（http://localhost:3000, localhost:3000等）
- 可在设置中开启/关闭此功能

### 服务发现
- 扫描运行中的服务
- 自动识别服务类型
- 支持Docker容器发现
- 支持系统服务发现

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔗 相关链接

- [Next.js 文档](https://nextjs.org/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Zustand 文档](https://github.com/pmndrs/zustand)
