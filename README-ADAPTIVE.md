# Homeland 自适应服务发现

## 功能特点

Homeland 现在支持自适应服务发现，可以根据运行环境自动选择最适合的扫描策略：

### 🔍 智能环境检测
- 自动检测是否运行在Docker容器中
- 检查可用的系统命令（systemctl、docker、netstat等）
- 根据环境能力调整扫描策略

### 📊 三种扫描模式

#### 1. 完整扫描模式（主机环境）
- ✅ systemd 服务扫描
- ✅ Docker 容器扫描  
- ✅ supervisord 服务扫描
- ✅ 网络端口扫描
- ✅ 进程信息获取

#### 2. 网络扫描模式（Docker容器环境）
- ✅ HTTP/HTTPS 服务检测
- ✅ 常用端口扫描（3000, 8080, 5432等）
- ✅ 服务类型智能识别
- ✅ Docker容器扫描（如有权限）

#### 3. 最小扫描模式（受限环境）
- ✅ 基础HTTP服务检测
- ✅ 常用Web端口扫描

### 🩺 自适应健康检查

支持多种健康检查方式，根据环境自动适配：

- **HTTP检查**: 发送HTTP请求检查服务状态
- **TCP检查**: 测试端口连通性
- **命令检查**: 执行系统命令（主机环境）
- **脚本检查**: 运行自定义脚本（主机环境）

### 🔧 环境适配特性

#### Docker容器中运行
- 自动跳过不可用的系统命令
- 使用网络方式检测服务
- 优化内存和性能使用
- 提供容器环境友好的错误信息

#### 主机上运行
- 完整的系统服务扫描能力
- 详细的进程和端口信息
- 支持所有健康检查类型

## 使用方法

### 基本使用

应用会自动检测环境并选择最佳扫描策略，无需手动配置。

```bash
# Docker环境
docker run -p 3000:3000 homeland

# 主机环境
npm run dev
```

### API使用

扫描服务：
```javascript
const response = await fetch('/api/services/scan', {
  method: 'POST'
})

const result = await response.json()
console.log('扫描策略:', result.environment.strategy)
console.log('发现服务:', result.services)
```

健康检查：
```javascript
// 自动健康检查
const result = await adaptiveHealthChecker.smartHealthCheck({
  name: 'my-service',
  type: 'HTTP',
  url: 'http://localhost:3000'
})

// 手动健康检查
const result = await adaptiveHealthChecker.checkHealth({
  serviceName: 'my-service',
  checkType: 'HTTP',
  url: 'http://localhost:3000/health',
  timeoutMs: 5000
})
```

## 环境信息

扫描完成后会返回环境信息：

```json
{
  "environment": {
    "isDocker": true,
    "strategy": "network",
    "description": "网络扫描模式：支持网络端口扫描和HTTP健康检查（Docker容器环境）",
    "capabilities": {
      "systemServices": false,
      "dockerContainers": false,
      "networkPorts": true,
      "processInfo": false
    }
  }
}
```

## 服务类型识别

系统会自动识别以下服务类型：

- **HTTP**: Web服务、API服务
- **DATABASE**: MySQL(3306)、PostgreSQL(5432)、MongoDB(27017)
- **CACHE**: Redis(6379)、Memcached
- **DOCKER**: Docker容器
- **SYSTEMD**: systemd管理的服务
- **SUPERVISORD**: supervisord管理的程序

## 故障排除

### 扫描结果为空
1. 检查环境信息中的扫描能力
2. 确认目标端口上确实有服务运行
3. 在Docker环境中检查网络连接

### 健康检查失败
1. 确认服务URL可访问
2. 检查防火墙设置
3. 在容器环境中避免使用系统命令

### 权限问题
```bash
# Docker环境中需要特殊权限访问主机Docker
# 不推荐在生产环境中使用
docker run -v /var/run/docker.sock:/var/run/docker.sock homeland
```

## 性能优化

- 并行扫描多个端口
- 智能超时控制
- 缓存环境检测结果
- 限制响应体大小避免内存问题

## 安全考虑

- 在容器环境中自动禁用危险命令
- 限制脚本执行权限
- 网络扫描使用安全的超时设置
- 不会尝试连接外部网络