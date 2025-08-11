import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'

const execAsync = promisify(exec)

export interface EnvironmentInfo {
  isDocker: boolean
  isHost: boolean
  availableCommands: {
    systemctl: boolean
    docker: boolean
    supervisorctl: boolean
    netstat: boolean
    ss: boolean
    lsof: boolean
  }
  scanCapabilities: {
    systemServices: boolean
    dockerContainers: boolean
    networkPorts: boolean
    processInfo: boolean
  }
}

class EnvironmentDetector {
  private static instance: EnvironmentDetector
  private environmentInfo: EnvironmentInfo | null = null

  private constructor() {}

  static getInstance(): EnvironmentDetector {
    if (!EnvironmentDetector.instance) {
      EnvironmentDetector.instance = new EnvironmentDetector()
    }
    return EnvironmentDetector.instance
  }

  async detectEnvironment(): Promise<EnvironmentInfo> {
    if (this.environmentInfo) {
      return this.environmentInfo
    }

    console.log('开始检测运行环境...')

    const isDocker = await this.isRunningInDocker()
    const availableCommands = await this.checkAvailableCommands()

    this.environmentInfo = {
      isDocker,
      isHost: !isDocker,
      availableCommands,
      scanCapabilities: {
        systemServices: availableCommands.systemctl,
        dockerContainers: availableCommands.docker,
        networkPorts: availableCommands.ss || availableCommands.netstat,
        processInfo: availableCommands.lsof || availableCommands.ss,
      }
    }

    console.log('环境检测结果:', this.environmentInfo)
    return this.environmentInfo
  }

  private async isRunningInDocker(): Promise<boolean> {
    try {
      // 方法1: 检查 /.dockerenv 文件
      if (fs.existsSync('/.dockerenv')) {
        console.log('检测到 /.dockerenv 文件，运行在Docker容器中')
        return true
      }

      // 方法2: 检查 /proc/1/cgroup
      try {
        const cgroupContent = fs.readFileSync('/proc/1/cgroup', 'utf8')
        if (cgroupContent.includes('docker') || cgroupContent.includes('containerd')) {
          console.log('从 /proc/1/cgroup 检测到Docker容器')
          return true
        }
      } catch {
        // 忽略文件读取错误
      }

      // 方法3: 检查 /proc/self/mountinfo
      try {
        const mountInfo = fs.readFileSync('/proc/self/mountinfo', 'utf8')
        if (mountInfo.includes('docker') || mountInfo.includes('overlay')) {
          console.log('从 /proc/self/mountinfo 检测到Docker容器')
          return true
        }
      } catch {
        // 忽略文件读取错误
      }

      // 方法4: 检查环境变量
      if (process.env.DOCKER_CONTAINER || process.env.container) {
        console.log('从环境变量检测到Docker容器')
        return true
      }

      console.log('未检测到Docker容器环境，运行在主机上')
      return false
    } catch (error) {
      console.warn('Docker环境检测时出错:', error)
      return false
    }
  }

  private async checkAvailableCommands(): Promise<EnvironmentInfo['availableCommands']> {
    const commands = ['systemctl', 'docker', 'supervisorctl', 'netstat', 'ss', 'lsof']
    const results: Partial<EnvironmentInfo['availableCommands']> = {}

    await Promise.all(
      commands.map(async (cmd) => {
        try {
          await execAsync(`which ${cmd}`)
          results[cmd as keyof EnvironmentInfo['availableCommands']] = true
          console.log(`✓ 命令可用: ${cmd}`)
        } catch {
          results[cmd as keyof EnvironmentInfo['availableCommands']] = false
          console.log(`✗ 命令不可用: ${cmd}`)
        }
      })
    )

    return results as EnvironmentInfo['availableCommands']
  }

  // 获取推荐的扫描策略
  getRecommendedScanStrategy(): 'full' | 'network' | 'minimal' {
    if (!this.environmentInfo) {
      return 'minimal'
    }

    if (this.environmentInfo.isHost && 
        this.environmentInfo.availableCommands.systemctl && 
        this.environmentInfo.availableCommands.docker) {
      return 'full'
    }

    if (this.environmentInfo.scanCapabilities.networkPorts) {
      return 'network'
    }

    return 'minimal'
  }

  // 获取扫描模式说明
  getScanModeDescription(): string {
    const strategy = this.getRecommendedScanStrategy()
    
    switch (strategy) {
      case 'full':
        return '完整扫描模式：支持系统服务、Docker容器和网络端口扫描'
      case 'network':
        return '网络扫描模式：支持网络端口扫描和HTTP健康检查（Docker容器环境）'
      case 'minimal':
        return '最小扫描模式：仅支持基础功能（受限环境）'
    }
  }
}

export const environmentDetector = EnvironmentDetector.getInstance()