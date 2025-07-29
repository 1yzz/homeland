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

# 停止现有容器
echo "📦 停止现有容器..."
docker-compose down

# 构建新镜像
echo "🔨 构建应用镜像..."
docker-compose build --no-cache

# 启动服务
echo "🌟 启动服务..."
docker-compose up -d

# 等待应用启动
echo "⏳ 等待应用启动..."
sleep 10

# 运行数据库迁移
echo "🗄️ 运行数据库迁移..."
docker-compose exec app npx prisma db push

# 检查服务状态
echo "✅ 检查服务状态..."
docker-compose ps

echo "🎉 部署完成！"
echo "📊 应用地址: http://localhost:4235"
echo ""
echo "🔍 查看日志: docker-compose logs -f app"
echo "🛑 停止服务: docker-compose down" 