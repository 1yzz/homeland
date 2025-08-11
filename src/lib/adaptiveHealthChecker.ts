import { exec } from 'child_process'
import { promisify } from 'util'
import { environmentDetector } from './environmentDetector'

const execAsync = promisify(exec)

export interface HealthCheckOptions {
  serviceName: string
  checkType: 'HTTP' | 'COMMAND' | 'SCRIPT' | 'TCP'
  url?: string
  command?: string
  script?: string
  timeoutMs?: number
  expectedStatus?: number
  expectedResponse?: string
  method?: string
  port?: number
}

export interface HealthCheckResult {
  healthy: boolean
  message: string
  responseTimeMs: number
  statusCode?: number
  responseBody?: string
  error?: string
  checkType: string
}

export class AdaptiveHealthChecker {
  async checkHealth(options: HealthCheckOptions): Promise<HealthCheckResult> {
    const startTime = Date.now()
    const envInfo = await environmentDetector.detectEnvironment()
    
    console.log(`执行健康检查: ${options.serviceName} (${options.checkType})`)
    
    try {
      switch (options.checkType) {
        case 'HTTP':
          return await this.httpHealthCheck(options, startTime)
        case 'COMMAND':
          return await this.commandHealthCheck(options, startTime, envInfo.isDocker)
        case 'SCRIPT':
          return await this.scriptHealthCheck(options, startTime, envInfo.isDocker)
        case 'TCP':
          return await this.tcpHealthCheck(options, startTime)
        default:
          throw new Error(`不支持的健康检查类型: ${options.checkType}`)
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      return {
        healthy: false,
        message: '健康检查执行失败',
        responseTimeMs: responseTime,
        error: error instanceof Error ? error.message : '未知错误',
        checkType: options.checkType,
      }
    }
  }

  private async httpHealthCheck(options: HealthCheckOptions, startTime: number): Promise<HealthCheckResult> {
    if (!options.url) {
      throw new Error('HTTP健康检查需要提供URL')
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || 5000)
      
      const response = await fetch(options.url, {
        method: options.method || 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Homeland-HealthChecker/1.0',
          'Accept': '*/*',
        },
      })
      
      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime
      
      let responseBody = ''
      try {
        responseBody = await response.text()
      } catch {
        responseBody = '无法读取响应体'
      }
      
      // 检查状态码
      const expectedStatus = options.expectedStatus || 200
      const statusMatches = response.status === expectedStatus
      
      // 检查响应内容
      const responseMatches = !options.expectedResponse || 
                            responseBody.includes(options.expectedResponse)
      
      const isHealthy = response.ok && statusMatches && responseMatches
      
      return {
        healthy: isHealthy,
        message: isHealthy ? 'HTTP健康检查通过' : 
                 `HTTP健康检查失败 (状态码: ${response.status})`,
        responseTimeMs: responseTime,
        statusCode: response.status,
        responseBody: responseBody.slice(0, 500), // 限制响应体长度
        checkType: 'HTTP',
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          healthy: false,
          message: 'HTTP请求超时',
          responseTimeMs: responseTime,
          statusCode: 0,
          error: '请求超时',
          checkType: 'HTTP',
        }
      }
      
      return {
        healthy: false,
        message: 'HTTP请求失败',
        responseTimeMs: responseTime,
        statusCode: 0,
        error: error instanceof Error ? error.message : '网络错误',
        checkType: 'HTTP',
      }
    }
  }

  private async commandHealthCheck(
    options: HealthCheckOptions, 
    startTime: number, 
    isDocker: boolean
  ): Promise<HealthCheckResult> {
    if (!options.command) {
      throw new Error('命令健康检查需要提供命令')
    }

    // 在Docker环境中，某些命令可能不可用，提供警告
    if (isDocker) {
      const restrictedCommands = ['systemctl', 'service', 'sudo']
      const hasRestrictedCommand = restrictedCommands.some(cmd => 
        options.command!.includes(cmd)
      )
      
      if (hasRestrictedCommand) {
        return {
          healthy: false,
          message: '命令在Docker环境中可能不可用',
          responseTimeMs: Date.now() - startTime,
          error: '检测到受限命令，在容器环境中可能无法执行',
          checkType: 'COMMAND',
        }
      }
    }

    try {
      const { stdout, stderr } = await execAsync(options.command, {
        timeout: options.timeoutMs || 5000,
        maxBuffer: 1024 * 1024, // 1MB
      })
      
      const responseTime = Date.now() - startTime
      const output = stdout + (stderr ? `\nSTDERR: ${stderr}` : '')
      
      // 检查预期响应
      const responseMatches = !options.expectedResponse || 
                            output.includes(options.expectedResponse)
      
      return {
        healthy: responseMatches,
        message: responseMatches ? '命令执行成功' : '命令输出不匹配预期',
        responseTimeMs: responseTime,
        responseBody: output.slice(0, 500),
        checkType: 'COMMAND',
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      return {
        healthy: false,
        message: '命令执行失败',
        responseTimeMs: responseTime,
        error: error instanceof Error ? error.message : '命令执行错误',
        checkType: 'COMMAND',
      }
    }
  }

  private async scriptHealthCheck(
    options: HealthCheckOptions, 
    startTime: number, 
    isDocker: boolean
  ): Promise<HealthCheckResult> {
    if (!options.script) {
      throw new Error('脚本健康检查需要提供脚本内容')
    }

    // 在Docker环境中提供安全警告
    if (isDocker && options.script.includes('systemctl')) {
      return {
        healthy: false,
        message: '脚本包含Docker环境中不可用的命令',
        responseTimeMs: Date.now() - startTime,
        error: 'systemctl命令在容器中不可用',
        checkType: 'SCRIPT',
      }
    }

    try {
      // 创建临时脚本（在Docker环境中使用/tmp）
      const tempDir = '/tmp'
      const scriptContent = `#!/bin/bash\nset -e\n${options.script}`
      
      // 使用内存方式执行脚本，避免文件系统问题
      const { stdout, stderr } = await execAsync(`bash -c '${scriptContent}'`, {
        timeout: options.timeoutMs || 5000,
        maxBuffer: 1024 * 1024,
      })
      
      const responseTime = Date.now() - startTime
      const output = stdout + (stderr ? `\nSTDERR: ${stderr}` : '')
      
      // 检查预期响应
      const responseMatches = !options.expectedResponse || 
                            output.includes(options.expectedResponse)
      
      return {
        healthy: responseMatches,
        message: responseMatches ? '脚本执行成功' : '脚本输出不匹配预期',
        responseTimeMs: responseTime,
        responseBody: output.slice(0, 500),
        checkType: 'SCRIPT',
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      return {
        healthy: false,
        message: '脚本执行失败',
        responseTimeMs: responseTime,
        error: error instanceof Error ? error.message : '脚本执行错误',
        checkType: 'SCRIPT',
      }
    }
  }

  private async tcpHealthCheck(options: HealthCheckOptions, startTime: number): Promise<HealthCheckResult> {
    if (!options.url && !options.port) {
      throw new Error('TCP健康检查需要提供URL或端口')
    }

    let host = 'localhost'
    let port = options.port || 80

    if (options.url) {
      try {
        const urlObj = new URL(options.url)
        host = urlObj.hostname
        port = parseInt(urlObj.port) || (urlObj.protocol === 'https:' ? 443 : 80)
      } catch {
        throw new Error('无效的URL格式')
      }
    }

    return new Promise((resolve) => {
      const net = require('net')
      const socket = new net.Socket()
      const timeoutMs = options.timeoutMs || 5000
      
      const timeout = setTimeout(() => {
        socket.destroy()
        const responseTime = Date.now() - startTime
        resolve({
          healthy: false,
          message: 'TCP连接超时',
          responseTimeMs: responseTime,
          error: `连接 ${host}:${port} 超时`,
          checkType: 'TCP',
        })
      }, timeoutMs)
      
      socket.on('connect', () => {
        clearTimeout(timeout)
        socket.destroy()
        const responseTime = Date.now() - startTime
        resolve({
          healthy: true,
          message: 'TCP连接成功',
          responseTimeMs: responseTime,
          checkType: 'TCP',
        })
      })
      
      socket.on('error', (error) => {
        clearTimeout(timeout)
        const responseTime = Date.now() - startTime
        resolve({
          healthy: false,
          message: 'TCP连接失败',
          responseTimeMs: responseTime,
          error: `连接 ${host}:${port} 失败: ${error.message}`,
          checkType: 'TCP',
        })
      })
      
      socket.connect(port, host)
    })
  }

  // 智能健康检查：根据服务类型自动选择检查方式
  async smartHealthCheck(service: {
    name: string
    type: string
    url?: string
    port?: number
  }): Promise<HealthCheckResult> {
    const startTime = Date.now()

    // 根据服务类型选择最佳检查方式
    if (service.url && (service.type === 'HTTP' || service.url.startsWith('http'))) {
      return await this.httpHealthCheck({
        serviceName: service.name,
        checkType: 'HTTP',
        url: service.url,
        timeoutMs: 5000,
      }, startTime)
    }

    if (service.port) {
      return await this.tcpHealthCheck({
        serviceName: service.name,
        checkType: 'TCP',
        port: service.port,
        timeoutMs: 3000,
      }, startTime)
    }

    // 数据库服务特殊处理
    if (service.type === 'DATABASE') {
      if (service.name.toLowerCase().includes('mysql') && service.port) {
        return await this.tcpHealthCheck({
          serviceName: service.name,
          checkType: 'TCP',
          port: service.port || 3306,
          timeoutMs: 3000,
        }, startTime)
      }
      
      if (service.name.toLowerCase().includes('postgres') && service.port) {
        return await this.tcpHealthCheck({
          serviceName: service.name,
          checkType: 'TCP',
          port: service.port || 5432,
          timeoutMs: 3000,
        }, startTime)
      }
    }

    // 默认返回未知状态
    return {
      healthy: false,
      message: '无法确定健康检查方式',
      responseTimeMs: Date.now() - startTime,
      error: '服务类型不支持自动健康检查',
      checkType: 'UNKNOWN',
    }
  }
}

export const adaptiveHealthChecker = new AdaptiveHealthChecker()