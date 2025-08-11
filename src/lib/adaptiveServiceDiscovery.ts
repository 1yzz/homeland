import { exec } from 'child_process'
import { promisify } from 'util'
import { environmentDetector, EnvironmentInfo } from './environmentDetector'

const execAsync = promisify(exec)

export interface AdaptiveService {
  name: string
  type: 'HTTP' | 'GRPC' | 'SYSTEMD' | 'SUPERVISORD' | 'DOCKER' | 'DATABASE' | 'CACHE' | 'CUSTOM'
  status: 'RUNNING' | 'STOPPED' | 'ERROR' | 'UNKNOWN'
  description: string
  port?: number
  url?: string
  processName?: string
  command?: string
  workingDir?: string
  envVars?: Record<string, string>
  source: 'network' | 'system' | 'docker' | 'config'
}

export class AdaptiveServiceDiscovery {
  private environmentInfo: EnvironmentInfo | null = null

  async scanServices(): Promise<AdaptiveService[]> {
    // 检测环境
    this.environmentInfo = await environmentDetector.detectEnvironment()
    
    const strategy = environmentDetector.getRecommendedScanStrategy()
    console.log(`使用扫描策略: ${strategy}`)
    console.log(`扫描模式: ${environmentDetector.getScanModeDescription()}`)

    const services: AdaptiveService[] = []

    switch (strategy) {
      case 'full':
        // 主机环境：完整扫描
        services.push(...await this.fullScan())
        break
      case 'network':
        // 容器环境：网络扫描
        services.push(...await this.networkScan())
        break
      case 'minimal':
        // 受限环境：最小扫描
        services.push(...await this.minimalScan())
        break
    }

    return this.deduplicateServices(services)
  }

  private async fullScan(): Promise<AdaptiveService[]> {
    console.log('执行完整扫描（主机环境）')
    const services: AdaptiveService[] = []

    // 并行执行所有扫描
    const scanPromises = []

    if (this.environmentInfo?.availableCommands.systemctl) {
      scanPromises.push(this.scanSystemdServices())
    }

    if (this.environmentInfo?.availableCommands.docker) {
      scanPromises.push(this.scanDockerContainers())
    }

    if (this.environmentInfo?.availableCommands.supervisorctl) {
      scanPromises.push(this.scanSupervisordServices())
    }

    // 网络端口扫描
    scanPromises.push(this.scanNetworkPorts())

    const results = await Promise.allSettled(scanPromises)
    
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        services.push(...result.value)
      }
    })

    return services
  }

  private async networkScan(): Promise<AdaptiveService[]> {
    console.log('执行网络扫描（容器环境）')
    const services: AdaptiveService[] = []

    // 网络端口扫描（使用容器中可用的命令）
    services.push(...await this.scanNetworkPorts())
    
    // 尝试扫描Docker容器（如果docker命令可用）
    if (this.environmentInfo?.availableCommands.docker) {
      try {
        services.push(...await this.scanDockerContainers())
      } catch (error) {
        console.log('Docker扫描失败（可能权限不足）:', error)
      }
    }

    return services
  }

  private async minimalScan(): Promise<AdaptiveService[]> {
    console.log('执行最小扫描（受限环境）')
    
    // 只能进行基础的HTTP检测
    return await this.scanCommonHttpServices()
  }

  private async scanNetworkPorts(): Promise<AdaptiveService[]> {
    const services: AdaptiveService[] = []
    const commonPorts = [3000, 3001, 8000, 8080, 8443, 5000, 9000, 4000, 80, 443, 3306, 5432, 6379, 27017]

    console.log('扫描网络端口...')

    for (const port of commonPorts) {
      try {
        const isListening = await this.isPortListening(port)
        if (isListening) {
          const serviceInfo = await this.analyzeNetworkService(port)
          if (serviceInfo) {
            services.push(serviceInfo)
          }
        }
      } catch (error) {
        // 忽略单个端口的错误
      }
    }

    return services
  }

  private async scanCommonHttpServices(): Promise<AdaptiveService[]> {
    const services: AdaptiveService[] = []
    const commonPorts = [3000, 3001, 8000, 8080, 5000]

    console.log('扫描常见HTTP服务...')

    for (const port of commonPorts) {
      try {
        const response = await fetch(`http://localhost:${port}`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(2000),
        })

        if (response.ok) {
          services.push({
            name: `HTTP Service on port ${port}`,
            type: 'HTTP',
            status: 'RUNNING',
            description: `HTTP服务运行在端口 ${port}`,
            port,
            url: `http://localhost:${port}`,
            source: 'network',
          })
        }
      } catch {
        // 服务不可用或超时
      }
    }

    return services
  }

  private async isPortListening(port: number): Promise<boolean> {
    const commands = []
    
    if (this.environmentInfo?.availableCommands.ss) {
      commands.push(`ss -tuln | grep :${port}`)
    }
    
    if (this.environmentInfo?.availableCommands.netstat) {
      commands.push(`netstat -tuln 2>/dev/null | grep :${port}`)
    }

    // 如果没有网络命令，尝试直接连接
    if (commands.length === 0) {
      return await this.testPortConnection(port)
    }

    for (const command of commands) {
      try {
        const { stdout } = await execAsync(command)
        if (stdout.trim()) return true
      } catch {
        continue
      }
    }

    return false
  }

  private async testPortConnection(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const net = require('net')
      const socket = new net.Socket()
      
      const timeout = setTimeout(() => {
        socket.destroy()
        resolve(false)
      }, 1000)

      socket.on('connect', () => {
        clearTimeout(timeout)
        socket.destroy()
        resolve(true)
      })

      socket.on('error', () => {
        clearTimeout(timeout)
        resolve(false)
      })

      socket.connect(port, 'localhost')
    })
  }

  private async analyzeNetworkService(port: number): Promise<AdaptiveService | null> {
    try {
      // 尝试HTTP检测
      const response = await fetch(`http://localhost:${port}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000),
      })

      const contentType = response.headers.get('content-type')
      const server = response.headers.get('server')
      
      let serviceType: AdaptiveService['type'] = 'HTTP'
      let serviceName = `Service on port ${port}`
      let description = `网络服务运行在端口 ${port}`

      // 根据端口和响应头判断服务类型
      if (port === 3306) {
        serviceType = 'DATABASE'
        serviceName = 'MySQL'
        description = 'MySQL数据库服务'
      } else if (port === 5432) {
        serviceType = 'DATABASE'
        serviceName = 'PostgreSQL'
        description = 'PostgreSQL数据库服务'
      } else if (port === 6379) {
        serviceType = 'CACHE'
        serviceName = 'Redis'
        description = 'Redis缓存服务'
      } else if (port === 27017) {
        serviceType = 'DATABASE'
        serviceName = 'MongoDB'
        description = 'MongoDB数据库服务'
      } else if (contentType?.includes('application/json')) {
        serviceName = `API Service on port ${port}`
        description = '检测到API服务'
      } else if (contentType?.includes('text/html')) {
        serviceName = `Web Service on port ${port}`
        description = '检测到Web应用'
      }

      return {
        name: serviceName,
        type: serviceType,
        status: 'RUNNING',
        description,
        port,
        url: serviceType === 'HTTP' ? `http://localhost:${port}` : undefined,
        source: 'network',
      }
    } catch {
      // HTTP请求失败，可能是其他类型的服务
      return {
        name: `Service on port ${port}`,
        type: 'CUSTOM',
        status: 'RUNNING',
        description: `未知类型服务运行在端口 ${port}`,
        port,
        source: 'network',
      }
    }
  }

  private async scanSystemdServices(): Promise<AdaptiveService[]> {
    const services: AdaptiveService[] = []
    
    try {
      const { stdout } = await execAsync('systemctl list-units --type=service --user --no-pager --plain')
      const lines = stdout.split('\n').filter(line => line.trim())
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/)
        if (parts.length < 4) continue
        
        const serviceName = parts[0].replace('.service', '')
        const activeState = parts[2]
        const subState = parts[3]
        const description = parts.slice(4).join(' ')
        
        if (this.isRelevantService(serviceName, description)) {
          services.push({
            name: serviceName,
            type: 'SYSTEMD',
            status: this.mapSystemdStatus(activeState, subState),
            description: description || '',
            source: 'system',
          })
        }
      }
    } catch (error) {
      console.error('systemd扫描失败:', error)
    }
    
    return services
  }

  private async scanDockerContainers(): Promise<AdaptiveService[]> {
    const services: AdaptiveService[] = []
    
    try {
      const { stdout } = await execAsync('docker ps -a --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}\\t{{.Image}}"')
      const lines = stdout.split('\n').slice(1).filter(line => line.trim())
      
      for (const line of lines) {
        const parts = line.split('\t')
        if (parts.length < 4) continue
        
        const containerName = parts[0].trim()
        const statusInfo = parts[1].trim()
        const portsInfo = parts[2].trim()
        const imageName = parts[3].trim()
        
        const ports = this.parseDockerPorts(portsInfo)
        const port = ports.length > 0 ? ports[0] : undefined
        
        services.push({
          name: containerName,
          type: 'DOCKER',
          status: statusInfo.startsWith('Up') ? 'RUNNING' : 'STOPPED',
          description: `Docker容器: ${imageName}`,
          port,
          url: port ? `http://localhost:${port}` : undefined,
          source: 'docker',
        })
      }
    } catch (error) {
      console.error('Docker扫描失败:', error)
    }
    
    return services
  }

  private async scanSupervisordServices(): Promise<AdaptiveService[]> {
    const services: AdaptiveService[] = []
    
    try {
      await execAsync('supervisorctl version')
      const { stdout } = await execAsync('supervisorctl status')
      const lines = stdout.split('\n').filter(line => line.trim())
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/)
        if (parts.length < 2) continue
        
        const programName = parts[0]
        const statusInfo = parts[1]
        const description = parts.slice(2).join(' ')
        
        services.push({
          name: programName,
          type: 'SUPERVISORD',
          status: this.mapSupervisordStatus(statusInfo),
          description: description || '',
          source: 'system',
        })
      }
    } catch (error) {
      console.error('supervisord扫描失败:', error)
    }
    
    return services
  }

  private parseDockerPorts(portsInfo: string): number[] {
    const ports: number[] = []
    
    if (!portsInfo || portsInfo === '') return ports
    
    const portMatches = portsInfo.match(/(\d+\.\d+\.\d+\.\d+:)?(\d+)->/g)
    
    if (portMatches) {
      for (const match of portMatches) {
        const portMatch = match.match(/:(\d+)->/)
        if (portMatch) {
          ports.push(parseInt(portMatch[1]))
        }
      }
    }
    
    return ports
  }

  private isRelevantService(serviceName: string, description: string): boolean {
    const name = serviceName.toLowerCase()
    const desc = (description || '').toLowerCase()
    
    // 跳过系统服务
    if (name.startsWith('systemd-') || name.startsWith('dbus') || 
        name.startsWith('networkmanager') || name.startsWith('bluetooth')) {
      return false
    }
    
    // 包含用户相关服务
    return desc.includes('web') || desc.includes('server') || desc.includes('api') ||
           name.includes('nginx') || name.includes('apache') || name.includes('mysql') ||
           name.includes('postgres') || name.includes('redis') || name.includes('node')
  }

  private mapSystemdStatus(activeState: string, subState: string): AdaptiveService['status'] {
    if (activeState === 'active' && subState === 'running') {
      return 'RUNNING'
    } else if (activeState === 'failed') {
      return 'ERROR'
    } else if (activeState === 'inactive') {
      return 'STOPPED'
    } else {
      return 'UNKNOWN'
    }
  }

  private mapSupervisordStatus(statusInfo: string): AdaptiveService['status'] {
    if (statusInfo === 'RUNNING') {
      return 'RUNNING'
    } else if (statusInfo === 'STOPPED' || statusInfo === 'EXITED') {
      return 'STOPPED'
    } else if (statusInfo === 'FATAL' || statusInfo === 'BACKOFF') {
      return 'ERROR'
    } else {
      return 'UNKNOWN'
    }
  }

  private deduplicateServices(services: AdaptiveService[]): AdaptiveService[] {
    const uniqueServices = new Map<string, AdaptiveService>()
    
    for (const service of services) {
      const key = `${service.name}-${service.port || 'noport'}`
      if (!uniqueServices.has(key)) {
        uniqueServices.set(key, service)
      }
    }
    
    return Array.from(uniqueServices.values())
  }
}