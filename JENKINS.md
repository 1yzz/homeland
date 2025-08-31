# Jenkins CI/CD 配置指南

## 📋 概述

本项目使用Jenkins进行自动化构建和部署。更新后的Jenkinsfile提供了完整的CI/CD流水线，支持参数化构建、代码质量检查、Docker容器化部署等功能。

## 🚀 功能特性

### ✨ 主要功能

- **参数化构建**: 支持选择部署环境、端口配置等
- **代码质量检查**: TypeScript类型检查、ESLint代码检查
- **Docker化部署**: 多阶段构建、容器化运行
- **健康检查**: 自动验证应用启动状态
- **版本管理**: 自动生成构建标签和版本号
- **资源清理**: 自动清理旧镜像和临时文件

### 🔧 构建参数

| 参数名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `APP_PORT` | String | 3000 | 应用内部端口 |
| `EXPOSE_PORT` | String | 3000 | 对外暴露端口 |
| `SKIP_TESTS` | Boolean | false | 跳过测试和代码检查 |
| `FORCE_REBUILD` | Boolean | false | 强制重新构建（清理缓存） |

## 📦 环境变量配置

### Jenkins环境变量

在Jenkins中配置以下环境变量：

```bash
# 数据库配置
DATABASE_URL="mysql://user:password@host:port/database"

# Watchdog服务配置
WATCHDOG_HOST="localhost"
WATCHDOG_PORT="50051"
WATCHDOG_TIMEOUT="10000"

# 可选配置
NODE_OPTIONS="--max-old-space-size=4096"
```

### 配置方式

1. **全局环境变量**: `Manage Jenkins > Configure System > Global Properties`
2. **Pipeline环境变量**: 在Jenkinsfile中的`environment`块
3. **Credentials**: `Manage Jenkins > Manage Credentials`

## 🏗️ 流水线阶段

### 1. Checkout & Info
- 检出源代码
- 显示构建信息和参数

### 2. Environment Setup
- 检查Docker环境
- 安装和配置pnpm
- 验证工具版本

### 3. Clean & Install
- 清理构建文件（可选）
- 强制重建依赖（可选）

### 4. Install Dependencies
- 使用pnpm安装项目依赖

### 5. Code Quality（并行执行）
- TypeScript类型检查
- ESLint代码检查

### 6. Build Application
- Next.js应用构建

### 7. Docker Build
- 构建Docker镜像
- 设置构建参数和标签

### 8. Deploy Container
- 停止现有容器
- 启动新容器
- 配置环境变量

### 9. Health Check
- 等待应用启动
- 执行健康检查API调用
- 验证响应状态

### 10. Post-Deploy Info
- 显示部署信息
- 提供管理命令

## 🔍 使用方法

### 首次设置

1. **创建Jenkins Pipeline任务**:
   ```
   New Item > Pipeline > Configure
   ```

2. **配置Pipeline**:
   - Pipeline Definition: `Pipeline script from SCM`
   - SCM: Git
   - Repository URL: 你的仓库地址
   - Script Path: `Jenkinsfile`

3. **配置构建参数**:
   - 勾选 "This project is parameterized"
   - Jenkins会自动识别Jenkinsfile中的parameters配置

### 执行构建

1. **标准构建**:
   ```
   Build with Parameters
   - APP_PORT: 3000
   - EXPOSE_PORT: 3000
   - SKIP_TESTS: false
   - FORCE_REBUILD: false
   ```

2. **快速构建（跳过检查）**:
   ```
   - SKIP_TESTS: true
   ```

3. **完全重建**:
   ```
   - FORCE_REBUILD: true
   ```

### 监控构建

```bash
# 查看构建状态
# 在Jenkins UI中查看Console Output

# 查看应用日志
docker logs -f homeland-app

# 检查应用健康
wget --no-verbose --tries=1 -O- http://localhost:3000/api/health
```

## 🔧 故障排查

### 常见问题

#### 1. 构建失败

**症状**: 构建在某个阶段失败
```bash
# 检查方法
1. 查看Jenkins Console Output
2. 检查具体失败的stage
3. 查看错误信息
```

**解决方案**:
- 依赖安装失败: 检查网络连接，尝试强制重建
- 类型检查失败: 修复TypeScript错误
- 构建失败: 检查代码语法错误

#### 2. Docker构建失败

**症状**: Docker镜像构建失败
```bash
# 检查方法
docker images | grep homeland
docker system df
```

**解决方案**:
- 磁盘空间不足: 清理Docker镜像 `docker system prune -f`
- 内存不足: 增加Docker内存限制
- 网络问题: 检查网络连接

#### 3. 容器启动失败

**症状**: 容器无法启动或健康检查失败
```bash
# 检查方法
docker ps -a --filter name=homeland-app
docker logs homeland-app
```

**解决方案**:
- 端口冲突: 修改EXPOSE_PORT参数
- 环境变量错误: 检查DATABASE_URL等配置
- 应用错误: 查看应用日志

#### 4. 健康检查超时

**症状**: 应用启动后健康检查API无响应
```bash
# 检查方法
wget --no-verbose --tries=1 -O- http://localhost:3000/api/health
telnet localhost 3000
```

**解决方案**:
- 应用启动慢: 增加健康检查等待时间
- API路径错误: 确认健康检查端点正确
- 防火墙问题: 检查端口访问权限

### 日志收集

```bash
# Jenkins构建日志
# 在Jenkins UI中下载Console Output

# Docker容器日志
docker logs --since 1h homeland-app > app.log

# 应用性能
docker stats homeland-app
```

## 📊 最佳实践

### 1. 版本管理
- 使用语义化版本号
- 构建标签包含构建号和Git commit
- 保留最近的镜像版本

### 2. 资源优化
- 定期清理旧镜像
- 使用Docker多阶段构建
- 优化依赖缓存

### 3. 安全考虑
- 不在Jenkinsfile中硬编码敏感信息
- 使用Jenkins Credentials管理密钥
- 定期更新基础镜像

### 4. 监控告警
- 配置构建失败通知
- 监控应用健康状态
- 设置资源使用告警

## 🚀 高级配置

### 多环境部署

```groovy
// 在Jenkinsfile中配置多环境
environment {
    STAGING_PORT = '3000'
    PRODUCTION_PORT = '8080'
    CURRENT_PORT = "${params.DEPLOY_ENV == 'production' ? env.PRODUCTION_PORT : env.STAGING_PORT}"
}
```

### 并行部署

```groovy
// 并行执行多个部署任务
parallel {
    stage('Deploy App') {
        steps { /* 部署应用 */ }
    }
    stage('Deploy Docs') {
        steps { /* 部署文档 */ }
    }
}
```

### 集成测试

```groovy
// 添加集成测试阶段
stage('Integration Tests') {
    steps {
        sh '''
        # 运行集成测试
        npm run test:integration
        '''
    }
}
```

---

**注意**: 请根据实际环境调整配置参数，确保所有依赖服务正常运行。
