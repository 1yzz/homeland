#!/bin/bash

# Homeland 部署脚本
# 使用方法: ./deploy.sh

set -e

# 配置变量
APP_NAME="homeland"
DEPLOY_PATH="/var/www/homeland"
LOG_PATH="/var/log/homeland"
PM2_APP_NAME="homeland"
NODE_VERSION="18.20.0"

echo "🚀 开始部署 Homeland 服务监控系统..."

# 检查Node.js版本
echo "📋 检查Node.js环境..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

if ! command -v nvm &> /dev/null; then
    echo "❌ NVM未安装，请先安装NVM"
    exit 1
fi

nvm use $NODE_VERSION
echo "✅ Node.js版本: $(node --version)"

# 安装依赖
echo "📦 安装依赖..."
npm ci --production=false

# 生成Prisma客户端
echo "🗄️ 生成Prisma客户端..."
npx prisma generate

# 构建应用
echo "🔨 构建应用..."
npm run build

# 创建部署目录
echo "📁 准备部署目录..."
sudo mkdir -p $DEPLOY_PATH
sudo mkdir -p $LOG_PATH
sudo chown $USER:$USER $DEPLOY_PATH
sudo chown $USER:$USER $LOG_PATH

# 复制文件到部署目录
echo "📋 复制文件到部署目录..."
rsync -av --exclude=node_modules --exclude=.git --exclude=.next . $DEPLOY_PATH/

# 切换到部署目录
cd $DEPLOY_PATH

# 安装生产依赖
echo "📦 安装生产依赖..."
npm ci --only=production

# 生成Prisma客户端
echo "🗄️ 生成生产环境Prisma客户端..."
npx prisma generate

# 停止现有应用
echo "🛑 停止现有应用..."
pm2 delete $PM2_APP_NAME 2>/dev/null || true

# 启动应用
echo "▶️ 启动应用..."
pm2 start ecosystem.config.js --env production
pm2 save

# 等待应用启动
echo "⏳ 等待应用启动..."
sleep 10

# 健康检查
echo "🏥 执行健康检查..."
if curl -f http://localhost:3000/api/system/ip > /dev/null 2>&1; then
    echo "✅ 应用启动成功！"
    echo "🌐 访问地址: http://localhost:3000"
    echo "📊 PM2状态:"
    pm2 status
else
    echo "❌ 应用启动失败，请检查日志"
    pm2 logs $PM2_APP_NAME --lines 20
    exit 1
fi

echo "🎉 部署完成！" 