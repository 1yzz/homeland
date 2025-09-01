#!/bin/bash

set -e  # 遇到错误立即退出

echo "🚀 开始 Homeland 生产环境 Docker 部署..."

# 配置默认值
APP_NAME="homeland-app"
APP_PORT="${PORT:-3000}"
EXPOSE_PORT="${EXPOSE_PORT:-3000}"
WATCHDOG_EXPOSE_PORT="${WATCHDOG_EXPOSE_PORT:-50051}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
DEPLOY_ENV="production"

# 检查必要的环境变量
check_env_vars() {
    local missing_vars=()
    
    # 检查可选但建议设置的环境变量
    if [ -z "$DATABASE_URL" ]; then
        echo "⚠️  警告: DATABASE_URL 环境变量未设置"
        echo "   应用可能无法正常连接数据库"
    fi
    
    if [ -z "$WATCHDOG_HOST" ]; then
        echo "⚠️  警告: WATCHDOG_HOST 环境变量未设置，使用默认值 localhost"
        export WATCHDOG_HOST="localhost"
    fi
    
    if [ -z "$WATCHDOG_PORT" ]; then
        echo "⚠️  警告: WATCHDOG_PORT 环境变量未设置，使用默认值 50051"
        export WATCHDOG_PORT="50051"
    fi
}

# 停止并清理现有容器
cleanup_existing() {
    echo "📦 清理现有容器..."
    if docker ps -q --filter name=$APP_NAME | grep -q .; then
        echo "   停止容器: $APP_NAME"
        docker stop $APP_NAME
    fi
    
    if docker ps -aq --filter name=$APP_NAME | grep -q .; then
        echo "   删除容器: $APP_NAME"
        docker rm $APP_NAME
    fi
    
    echo "   清理完成"
}

# 构建 Docker 镜像
build_image() {
    echo "🔨 构建 Docker 镜像..."
    
    # 构建参数
    BUILD_ARGS=(
        "--build-arg" "NEXT_PUBLIC_APP_NAME=Homeland"
        "--build-arg" "NEXT_PUBLIC_APP_VERSION=1.0.0"
        "--build-arg" "DATABASE_URL=${DATABASE_URL}"
        "--build-arg" "WATCHDOG_HOST=${WATCHDOG_HOST}"
        "--build-arg" "WATCHDOG_PORT=${WATCHDOG_PORT}"
        "--build-arg" "WATCHDOG_TIMEOUT=${WATCHDOG_TIMEOUT:-10000}"
        "-t" "homeland:${IMAGE_TAG}"
        "."
    )
    
    if ! docker build "${BUILD_ARGS[@]}"; then
        echo "❌ 镜像构建失败"
        exit 1
    fi
    
    echo "   镜像构建成功: homeland:${IMAGE_TAG}"
}

# 运行容器
run_container() {
    echo "🚀 启动容器..."
    
    # 运行参数
    RUN_ARGS=(
        "-d"
        "--name" "$APP_NAME"
        "--restart" "unless-stopped"
        "-p" "${EXPOSE_PORT}:${APP_PORT}"
        "-p" "${WATCHDOG_EXPOSE_PORT}:50051"
        "-e" "NODE_ENV=production"
        "-e" "PORT=${APP_PORT}"
        "-e" "HOSTNAME=0.0.0.0"
    )
    
    # 添加环境变量
    if [ -n "$DATABASE_URL" ]; then
        RUN_ARGS+=("-e" "DATABASE_URL=${DATABASE_URL}")
    fi
    
    RUN_ARGS+=(
        "-e" "WATCHDOG_HOST=${WATCHDOG_HOST}"
        "-e" "WATCHDOG_PORT=${WATCHDOG_PORT}"
        "-e" "WATCHDOG_TIMEOUT=${WATCHDOG_TIMEOUT:-10000}"
    )
    
    if ! docker run "${RUN_ARGS[@]}" "homeland:${IMAGE_TAG}"; then
        echo "❌ 容器启动失败"
        exit 1
    fi
    
    echo "   容器启动成功"
}

# 等待应用启动
wait_for_app() {
    echo "⏳ 等待应用启动..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if wget --no-verbose --tries=1 --spider "http://localhost:${EXPOSE_PORT}/api/health" >/dev/null 2>&1; then
            echo "   应用启动成功！"
            return 0
        fi
        
        echo "   尝试 $attempt/$max_attempts..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ 应用启动超时"
    echo "🔍 查看容器日志:"
    docker logs --tail 20 $APP_NAME
    return 1
}

# 显示部署信息
show_deployment_info() {
    echo ""
    echo "🎉 部署完成！"
    echo "📊 应用地址: http://localhost:${EXPOSE_PORT}"
    echo "🔍 健康检查: http://localhost:${EXPOSE_PORT}/api/health"
    echo "🔌 Watchdog gRPC: localhost:${WATCHDOG_EXPOSE_PORT}"
    echo ""
    echo "📋 管理命令:"
    echo "   查看日志: docker logs -f $APP_NAME"
    echo "   停止服务: docker stop $APP_NAME"
    echo "   重启服务: docker restart $APP_NAME"
    echo "   删除容器: docker rm $APP_NAME"
    echo ""
    echo "📊 容器状态:"
    docker ps --filter name=$APP_NAME --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# 主函数
main() {
    check_env_vars
    cleanup_existing
    build_image
    run_container
    
    if wait_for_app; then
        show_deployment_info
    else
        echo "❌ 部署失败"
        exit 1
    fi
}

# 执行主函数
main "$@" 