#!/bin/bash

echo "🚀 开始 Docker Compose 部署..."

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
    echo "❌ 错误: DATABASE_URL 环境变量未设置"
    echo "请设置数据库连接字符串，例如："
    echo "export DATABASE_URL='mysql://debian-sys-maint:xT0kukO54qnQyRPh@host.docker.internal:3306/homeland_sites'"
    echo ""
    echo "如果数据库在宿主机上运行，使用 host.docker.internal 替代 localhost"
    exit 1
fi

echo "🔗 使用数据库: ${DATABASE_URL}"

# 停止并删除现有容器
echo "📦 停止现有容器..."
docker compose down

# 构建并启动服务
echo "🔨 构建并启动服务..."
docker compose up -d --build

# 等待应用启动
echo "⏳ 等待应用启动..."
sleep 15

# 运行数据库迁移
echo "🗄️ 运行数据库迁移..."
docker compose exec homeland npx prisma db push

# 检查服务状态
echo "✅ 检查服务状态..."
docker compose ps

echo "🎉 部署完成！"
echo "📊 应用地址: http://localhost:4235"
echo ""
echo "🔍 查看日志: docker compose logs -f homeland"
echo "🛑 停止服务: docker compose down"
echo "🔄 重启服务: docker compose restart" 