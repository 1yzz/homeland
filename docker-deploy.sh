#!/bin/bash

echo "🚀 开始 Docker 部署..."

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
    echo "❌ 错误: DATABASE_URL 环境变量未设置"
    echo "请设置数据库连接字符串，例如："
    echo "export DATABASE_URL='mysql://user:password@localhost:3306/database'"    
    exit 1
fi

# 为 Docker 环境创建数据库 URL（使用 host 网络模式，可以直接访问 localhost）
export DOCKER_DATABASE_URL="${DATABASE_URL}"

echo "🔗 使用数据库: ${DOCKER_DATABASE_URL}"

# 停止并删除现有容器
echo "📦 停止现有容器..."
docker stop homeland-app 2>/dev/null || true
docker rm homeland-app 2>/dev/null || true

# 构建镜像
echo "🔨 构建 Docker 镜像..."
docker build \
    --build-arg DATABASE_URL="${DOCKER_DATABASE_URL}" \
    --build-arg NODE_ENV=production \
    --build-arg PORT=4235 \
    --build-arg HOSTNAME=0.0.0.0 \
    -t homeland:latest .

# 启动容器
echo "🚀 启动容器..."
docker run -d \
    --name homeland-app \
    --network host \
    --restart unless-stopped \
    -e DATABASE_URL="${DOCKER_DATABASE_URL}" \
    -e NODE_ENV=production \
    -e PORT=4235 \
    -e HOSTNAME=0.0.0.0 \
    homeland:latest

# 等待应用启动
echo "⏳ 等待应用启动..."
sleep 15

# 运行数据库迁移
echo "🗄️ 运行数据库迁移..."
docker exec homeland-app npx prisma db push

# 检查容器状态
echo "✅ 检查容器状态..."
docker ps --filter name=homeland-app

echo "🎉 部署完成！"
echo "📊 应用地址: http://localhost:4235"
echo ""
echo "🔍 查看日志: docker logs -f homeland-app"
echo "🛑 停止服务: docker stop homeland-app"
echo "🔄 重启服务: docker restart homeland-app" 