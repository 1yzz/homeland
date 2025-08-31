#!/bin/bash

set -e

echo "🏗️  开始构建 Homeland 应用..."

# 检查 Node.js 和 pnpm
check_prerequisites() {
    echo "🔍 检查构建环境..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js 未安装"
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        echo "❌ pnpm 未安装"
        echo "   请运行: npm install -g pnpm"
        exit 1
    fi
    
    echo "   ✅ Node.js $(node --version)"
    echo "   ✅ pnpm $(pnpm --version)"
}

# 清理旧的构建文件
clean_build() {
    echo "🧹 清理构建目录..."
    rm -rf .next out dist node_modules/.cache
    echo "   构建目录已清理"
}

# 安装依赖
install_deps() {
    echo "📦 安装依赖..."
    pnpm install --frozen-lockfile
    echo "   依赖安装完成"
}

# 类型检查
type_check() {
    echo "🔍 类型检查..."
    pnpm type-check
    echo "   类型检查通过"
}

# 代码检查
lint_check() {
    echo "📝 代码检查..."
    pnpm lint
    echo "   代码检查通过"
}

# 构建应用
build_app() {
    echo "🔨 构建应用..."
    pnpm build
    echo "   应用构建完成"
}

# 显示构建信息
show_build_info() {
    echo ""
    echo "🎉 构建成功！"
    echo ""
    echo "📁 构建输出:"
    echo "   .next/          - Next.js 构建输出"
    echo "   .next/static/   - 静态资源"
    echo ""
    echo "🚀 运行命令:"
    echo "   开发模式: pnpm dev"
    echo "   生产模式: pnpm start"
    echo "   Docker:   pnpm docker:build && pnpm docker:run"
}

# 主函数
main() {
    check_prerequisites
    clean_build
    install_deps
    type_check
    lint_check
    build_app
    show_build_info
}

# 处理命令行参数
case "${1:-}" in
    --skip-checks)
        echo "⚠️  跳过类型检查和代码检查"
        skip_checks=true
        ;;
    --clean-only)
        clean_build
        echo "🎉 清理完成"
        exit 0
        ;;
    --help|-h)
        echo "用法: $0 [选项]"
        echo ""
        echo "选项:"
        echo "  --skip-checks   跳过类型检查和代码检查"
        echo "  --clean-only    仅清理构建目录"
        echo "  --help, -h      显示帮助信息"
        exit 0
        ;;
esac

# 执行构建
if [ "${skip_checks:-}" = "true" ]; then
    check_prerequisites
    clean_build
    install_deps
    build_app
    show_build_info
else
    main
fi
