# Homeland 部署指南

## 📋 目录

- [快速开始](#快速开始)
- [环境准备](#环境准备)
- [本地开发](#本地开发)
- [Docker 部署](#docker-部署)
- [生产环境部署](#生产环境部署)
- [环境变量配置](#环境变量配置)
- [故障排查](#故障排查)

## 🚀 快速开始

### 1. 环境准备

```bash
# 安装 Node.js 18+ 和 pnpm
curl -fsSL https://nodejs.org/dist/v20.11.0/node-v20.11.0-linux-x64.tar.xz | tar -xJ
npm install -g pnpm

# 克隆项目
git clone <repository-url>
cd homeland
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp env.template .env.local

# 编辑环境变量
nano .env.local
```

### 3. 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 应用将在 http://localhost:30010 启动
```

## 🛠️ 环境准备

### 系统要求

- **Node.js**: >= 18.18.0
- **pnpm**: >= 8.0.0
- **Docker**: >= 20.10.0 (可选)
- **内存**: >= 2GB
- **磁盘**: >= 1GB

### 安装依赖

```bash
# Ubuntu/Debian
apt update && apt install -y curl build-essential

# CentOS/RHEL
yum update && yum install -y curl gcc-c++ make

# 安装 Node.js (使用 NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# 安装 pnpm
npm install -g pnpm
```

## 💻 本地开发

### 开发流程

```bash
# 1. 安装依赖
pnpm install

# 2. 启动开发服务器
pnpm dev

# 3. 代码检查
pnpm lint

# 4. 类型检查
pnpm type-check

# 5. 构建应用
pnpm build
```

### 可用脚本

```bash
# 开发
pnpm dev                    # 启动开发服务器
pnpm build                  # 构建生产版本
pnpm start                  # 启动生产服务器

# 代码质量
pnpm lint                   # ESLint 检查
pnpm lint:fix              # 自动修复 ESLint 问题
pnpm type-check            # TypeScript 类型检查

# 清理
pnpm clean                 # 清理构建文件

# Docker
pnpm docker:build          # 构建 Docker 镜像
pnpm docker:run            # 运行 Docker 容器
pnpm docker:stop           # 停止 Docker 容器
pnpm docker:logs           # 查看容器日志

# 部署
pnpm deploy                # 执行部署脚本
```

## 🐳 Docker 部署

### 使用脚本部署（推荐）

```bash
# 设置环境变量
export DATABASE_URL="mysql://user:password@localhost:3306/database"
export WATCHDOG_HOST="localhost"
export WATCHDOG_PORT="50051"

# 执行部署
./docker-deploy.sh
```

### 手动 Docker 部署

```bash
# 1. 构建镜像
docker build -t homeland:latest .

# 2. 运行容器
docker run -d \
  --name homeland-app \
  --restart unless-stopped \
  -p 30010:30010 \
  -p 50051:50051 \
  -e DATABASE_URL="your-database-url" \
  -e WATCHDOG_HOST="localhost" \
  -e WATCHDOG_PORT="50051" \
  homeland:latest

# 3. 检查状态
docker ps
docker logs homeland-app
```

### Docker 管理命令

```bash
# 查看日志
docker logs -f homeland-app

# 停止容器
docker stop homeland-app

# 重启容器
docker restart homeland-app

# 删除容器
docker rm homeland-app

# 进入容器
docker exec -it homeland-app sh
```

## 🌐 生产环境部署

### 使用构建脚本

```bash
# 完整构建（包含检查）
./build.sh

# 跳过检查的快速构建
./build.sh --skip-checks

# 仅清理
./build.sh --clean-only
```

### 手动生产部署

```bash
# 1. 环境准备
export NODE_ENV=production

# 2. 安装生产依赖
pnpm install --frozen-lockfile --prod

# 3. 构建应用
pnpm build

# 4. 启动应用
pnpm start
```

### 使用 PM2（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start npm --name "homeland" -- start

# 管理应用
pm2 status
pm2 logs homeland
pm2 restart homeland
pm2 stop homeland
```

## ⚙️ 环境变量配置

### 必需环境变量

```bash
# 数据库连接
DATABASE_URL="mysql://user:password@host:port/database"

# Watchdog 服务
WATCHDOG_HOST="localhost"        # Watchdog 服务主机
WATCHDOG_PORT="50051"           # Watchdog 服务端口
```

### 可选环境变量

```bash
# 应用配置
NODE_ENV="production"           # 运行环境
PORT="3000"                    # 应用端口
HOSTNAME="0.0.0.0"             # 绑定主机

# 应用信息
NEXT_PUBLIC_APP_NAME="Homeland" # 应用名称
NEXT_PUBLIC_APP_VERSION="1.0.0" # 应用版本

# 服务配置
WATCHDOG_TIMEOUT="10000"        # 超时时间（毫秒）
LOG_LEVEL="info"               # 日志级别
```

### 环境变量文件

```bash
# 开发环境
.env.local              # 本地开发环境变量

# 生产环境
.env.production         # 生产环境变量

# 模板文件
env.template            # 环境变量模板
```

## 🔧 故障排查

### 常见问题

#### 1. 端口被占用

```bash
# 查看端口占用
lsof -i :3000
netstat -tulpn | grep :3000

# 杀死进程
kill -9 <PID>
```

#### 2. 内存不足

```bash
# 检查内存使用
free -h
docker stats

# 清理 Docker
docker system prune -f
```

#### 3. 构建失败

```bash
# 清理并重新构建
pnpm clean
rm -rf node_modules
pnpm install
pnpm build
```

#### 4. 数据库连接失败

```bash
# 检查数据库连接
mysql -h host -P port -u user -p database

# 检查环境变量
echo $DATABASE_URL
```

### 日志查看

```bash
# 应用日志
docker logs -f homeland-app

# PM2 日志
pm2 logs homeland
```

### 健康检查

```bash
# 应用健康检查
wget --no-verbose --tries=1 --spider http://localhost:3000/api/health

# Docker 健康检查
docker inspect homeland-app | grep Health -A 10
```

### 性能监控

```bash
# 系统资源
htop
docker stats

# 应用监控
pm2 monit
```

## 📞 获取帮助

如果遇到问题，请检查：

1. 📄 查看日志文件
2. 🔍 检查环境变量配置
3. 🌐 验证网络连接
4. 💾 确认磁盘空间
5. 🔧 重启相关服务

---

**注意**: 请根据实际环境调整配置参数。
