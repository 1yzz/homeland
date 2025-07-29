#!/bin/bash

echo "🚀 开始Docker部署..."

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
    echo "❌ 错误: DATABASE_URL 环境变量未设置"
    echo "请设置数据库连接字符串:"
    echo "export DATABASE_URL='mysql://user:password@host:port/homeland_sites'"
    echo "或在Jenkins中配置DATABASE_URL凭据"
    exit 1
fi

echo "🔗 使用数据库: ${DATABASE_URL%/*}/[database]"

# 停止并删除现有容器
echo "📦 停止现有容器..."
docker stop homeland-app 2>/dev/null || true
docker rm homeland-app 2>/dev/null || true

# 构建新镜像
echo "🔨 构建应用镜像..."
docker build -t homeland:latest .

# 启动服务
echo "🌟 启动服务..."
docker run -d \
    --name homeland-app \
    -p 4235:4235 \
    -e DATABASE_URL="$DATABASE_URL" \
    -e NODE_ENV=production \
    --restart unless-stopped \
    homeland:latest

# 等待应用启动
echo "⏳ 等待应用启动..."
sleep 15

# 运行数据库迁移
echo "🗄️ 运行数据库迁移..."
docker exec homeland-app npx prisma db push

# 检查服务状态
echo "✅ 检查服务状态..."
docker ps | grep homeland-app

echo "🎉 部署完成！"
echo "📊 应用地址: http://localhost:4235"
echo ""
echo "🔍 查看日志: docker logs -f homeland-app"
echo "🛑 停止服务: docker stop homeland-app"
echo "🗑️ 删除容器: docker rm homeland-app" 