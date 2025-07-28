import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface SystemService {
  name: string
  type: 'SYSTEMD' | 'SUPERVISORD' | 'DOCKER' | 'HTTP' | 'GRPC' | 'DATABASE' | 'CACHE' | 'CUSTOM'
  status: 'RUNNING' | 'STOPPED' | 'ERROR' | 'UNKNOWN'
  description?: string
  port?: number
  url?: string
}

// 扫描 systemd 服务
export async function scanSystemdServices(): Promise<SystemService[]> {
  const services: SystemService[] = []
  
  try {
    // 获取所有服务状态
    const { stdout } = await execAsync('systemctl list-units --type=service --all --no-pager --plain')
    const lines = stdout.split('\n').filter(line => line.trim())
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/)
      if (parts.length < 4) continue
      
      const serviceName = parts[0].replace('.service', '')
      const loadState = parts[1]
      const activeState = parts[2]
      const subState = parts[3]
      const description = parts.slice(4).join(' ')
      
      // 跳过系统内置服务和模板服务
      if (serviceName.includes('@') || 
          serviceName.startsWith('systemd-') ||
          serviceName.startsWith('dbus') ||
          serviceName.startsWith('NetworkManager') ||
          serviceName.startsWith('bluetooth') ||
          serviceName.startsWith('cups') ||
          loadState === 'not-found') {
        continue
      }
      
      // 只包含用户相关的服务
      if (description && (
          description.toLowerCase().includes('web') ||
          description.toLowerCase().includes('server') ||
          description.toLowerCase().includes('service') ||
          description.toLowerCase().includes('daemon') ||
          description.toLowerCase().includes('api') ||
          serviceName.includes('nginx') ||
          serviceName.includes('apache') ||
          serviceName.includes('mysql') ||
          serviceName.includes('postgres') ||
          serviceName.includes('redis') ||
          serviceName.includes('mongodb') ||
          serviceName.includes('node') ||
          serviceName.includes('python') ||
          serviceName.includes('php') ||
          serviceName.includes('java')
      )) {
        let status: 'RUNNING' | 'STOPPED' | 'ERROR' | 'UNKNOWN' = 'UNKNOWN'
        
        if (activeState === 'active' && subState === 'running') {
          status = 'RUNNING'
        } else if (activeState === 'inactive' || activeState === 'failed') {
          status = activeState === 'failed' ? 'ERROR' : 'STOPPED'
        }
        
        // 尝试获取服务的端口信息
        const port = await getServicePort(serviceName, 'systemd')
        
        services.push({
          name: serviceName,
          type: 'SYSTEMD',
          status,
          description: description || '',
          port,
          url: port ? `http://localhost:${port}` : undefined
        })
      }
    }
  } catch (error) {
    console.error('扫描 systemd 服务失败:', error)
  }
  
  return services
}

// 扫描 supervisord 服务
export async function scanSupervisordServices(): Promise<SystemService[]> {
  const services: SystemService[] = []
  
  try {
    // 检查 supervisord 是否运行
    await execAsync('supervisorctl version')
    
    // 获取所有程序状态
    const { stdout } = await execAsync('supervisorctl status')
    const lines = stdout.split('\n').filter(line => line.trim())
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/)
      if (parts.length < 2) continue
      
      const programName = parts[0]
      const statusInfo = parts[1]
      const description = parts.slice(2).join(' ')
      
      let status: 'RUNNING' | 'STOPPED' | 'ERROR' | 'UNKNOWN' = 'UNKNOWN'
      
      if (statusInfo === 'RUNNING') {
        status = 'RUNNING'
      } else if (statusInfo === 'STOPPED' || statusInfo === 'EXITED') {
        status = 'STOPPED'
      } else if (statusInfo === 'FATAL' || statusInfo === 'BACKOFF') {
        status = 'ERROR'
      }
      
      // 尝试获取端口信息
      const port = await getServicePort(programName, 'supervisord')
      
      services.push({
        name: programName,
        type: 'SUPERVISORD',
        status,
        description: description || '',
        port,
        url: port ? `http://localhost:${port}` : undefined
      })
    }
  } catch (error) {
    console.error('扫描 supervisord 服务失败:', error)
  }
  
  return services
}

// 扫描 Docker 容器
export async function scanDockerContainers(): Promise<SystemService[]> {
  const services: SystemService[] = []
  
  try {
    // 获取所有容器（包括停止的）
    const { stdout } = await execAsync('docker ps -a --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}\\t{{.Image}}"')
    const lines = stdout.split('\n').slice(1).filter(line => line.trim()) // 跳过表头
    
    for (const line of lines) {
      const parts = line.split('\t')
      if (parts.length < 4) continue
      
      const containerName = parts[0].trim()
      const statusInfo = parts[1].trim()
      const portsInfo = parts[2].trim()
      const imageName = parts[3].trim()
      
      let status: 'RUNNING' | 'STOPPED' | 'ERROR' | 'UNKNOWN' = 'UNKNOWN'
      
      if (statusInfo.startsWith('Up')) {
        status = 'RUNNING'
      } else if (statusInfo.startsWith('Exited')) {
        status = 'STOPPED'
      }
      
      // 解析端口信息
      const ports = parseDockerPorts(portsInfo)
      const port = ports.length > 0 ? ports[0] : undefined
      
      services.push({
        name: containerName,
        type: 'DOCKER',
        status,
        description: `Docker 容器: ${imageName}`,
        port,
        url: port ? `http://localhost:${port}` : undefined
      })
    }
  } catch (error) {
    console.error('扫描 Docker 容器失败:', error)
  }
  
  return services
}

// 尝试获取服务监听的端口
async function getServicePort(serviceName: string, serviceType: string): Promise<number | undefined> {
  try {
    let processName = serviceName
    
    // 根据服务类型和名称猜测进程名
    if (serviceType === 'systemd') {
      // 常见的服务名映射
      const nameMapping: { [key: string]: string } = {
        'nginx': 'nginx',
        'apache2': 'apache2',
        'httpd': 'httpd',
        'mysql': 'mysqld',
        'mariadb': 'mysqld',
        'postgresql': 'postgres',
        'redis': 'redis-server',
        'mongodb': 'mongod',
        'elasticsearch': 'java',
        'node': 'node',
        'python': 'python'
      }
      
      processName = nameMapping[serviceName] || serviceName
    }
    
    // 使用多种方法查找端口
    const commands = [
      `lsof -i -P -n | grep ${processName} | grep LISTEN`,
      `netstat -tuln | grep LISTEN | grep -E "(${processName}|:80|:443|:3000|:8000|:8080|:9000)"`,
      `ss -tuln | grep LISTEN | grep -E "(${processName}|:80|:443|:3000|:8000|:8080|:9000)"`
    ]
    
    for (const command of commands) {
      try {
        const { stdout } = await execAsync(command)
        const lines = stdout.split('\n').filter(line => line.trim())
        
        for (const line of lines) {
          const portMatch = line.match(/:(\d+)/)
          if (portMatch) {
            const port = parseInt(portMatch[1])
            // 过滤系统端口和常见的非web端口
            if (port > 1024 && port < 65536) {
              return port
            }
          }
        }
      } catch (error) {
        // 继续尝试下一个命令
      }
    }
  } catch (error) {
    // 端口查找失败不影响服务发现
  }
  
  return undefined
}

// 检查 systemd 服务是否启用自动启动
async function isServiceEnabled(serviceName: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`systemctl is-enabled ${serviceName}`)
    return stdout.trim() === 'enabled'
  } catch (error) {
    return false
  }
}

// 解析 Docker 端口映射
function parseDockerPorts(portsInfo: string): number[] {
  const ports: number[] = []
  
  if (!portsInfo || portsInfo === '') return ports
  
  // 匹配端口映射格式: 0.0.0.0:8080->80/tcp
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

// 智能检测服务类型
export function detectServiceType(service: SystemService): 'HTTP' | 'GRPC' | 'DATABASE' | 'CACHE' | 'SYSTEMD' | 'SUPERVISORD' | 'DOCKER' | 'CUSTOM' {
  // 如果已经指定了类型，直接返回
  if (service.type !== 'SYSTEMD' && service.type !== 'SUPERVISORD' && service.type !== 'DOCKER') {
    return service.type
  }
  
  const name = service.name.toLowerCase()
  const description = (service.description || '').toLowerCase()
  
  // gRPC 服务
  if (name.includes('grpc') || description.includes('grpc') ||
      name.includes('protobuf') || description.includes('protobuf')) {
    return 'GRPC'
  }
  
  // Web 服务器和HTTP服务
  if (name.includes('nginx') || name.includes('apache') || name.includes('httpd') ||
      name.includes('api') || name.includes('web') || name.includes('http') ||
      name.includes('backend') || name.includes('frontend') || name.includes('server') ||
      description.includes('web server') || description.includes('http server') ||
      description.includes('api') || description.includes('web') || description.includes('http')) {
    return 'HTTP'
  }
  
  // 数据库服务
  if (name.includes('mysql') || name.includes('postgres') || name.includes('mongodb') ||
      name.includes('redis') || name.includes('mariadb') || name.includes('sqlite') ||
      description.includes('database') || description.includes('db')) {
    return 'DATABASE'
  }
  
  // 缓存服务
  if (name.includes('redis') || name.includes('memcached') || name.includes('cache') ||
      description.includes('cache') || description.includes('caching')) {
    return 'CACHE'
  }
  
  // 默认返回系统类型
  return service.type as 'SYSTEMD' | 'SUPERVISORD' | 'DOCKER'
}

// 综合扫描所有系统服务
export async function scanAllSystemServices(): Promise<SystemService[]> {
  const allServices: SystemService[] = []
  
  try {
    // 并行扫描各种服务
    const [systemdServices, supervisordServices, dockerServices] = await Promise.allSettled([
      scanSystemdServices(),
      scanSupervisordServices(),
      scanDockerContainers()
    ])
    
    if (systemdServices.status === 'fulfilled') {
      allServices.push(...systemdServices.value)
    }
    
    if (supervisordServices.status === 'fulfilled') {
      allServices.push(...supervisordServices.value)
    }
    
    if (dockerServices.status === 'fulfilled') {
      allServices.push(...dockerServices.value)
    }
    
    // 去重（基于服务名和端口）
    const uniqueServices = allServices.filter((service, index, array) => {
      return array.findIndex(s => 
        s.name === service.name && 
        s.type === service.type &&
        s.port === service.port
      ) === index
    })
    
    // 智能检测服务类型
    return uniqueServices.map(service => ({
      ...service,
      type: detectServiceType(service)
    }))
    
  } catch (error) {
    console.error('扫描系统服务失败:', error)
    return []
  }
}