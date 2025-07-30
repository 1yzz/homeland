import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface Service {
  name: string
  port: number
  type: string
  status: 'running' | 'stopped'
  url: string
  description?: string
}

export async function scanRunningServices(): Promise<Service[]> {
  const services: Service[] = []
  
  try {
    // Scan for common web services on standard ports
    const commonPorts = [3000, 3001, 8000, 8080, 8443, 5000, 9000, 4000]
    
    for (const port of commonPorts) {
      try {
        const { stdout } = await execAsync(`netstat -tuln | grep :${port}`)
        if (stdout.trim()) {
          // Check if it's a web service by trying to determine service type
          const serviceType = await detectServiceType(port)
          if (serviceType) {
            services.push({
              name: `Service on port ${port}`,
              port,
              type: serviceType,
              status: 'running',
              url: `http://localhost:${port}`,
              description: `Detected ${serviceType} service`
            })
          }
        }
      } catch {
        // Port not in use, continue
      }
    }

    // Scan for Docker containers with exposed ports
    try {
      const { stdout } = await execAsync('docker ps --format "table {{.Names}}\\t{{.Ports}}" 2>/dev/null')
      const dockerServices = parseDockerOutput(stdout)
      services.push(...dockerServices)
    } catch {
      // Docker not available or no containers
    }

  } catch {
    console.error('Error scanning services')
  }

  return services
}

async function detectServiceType(port: number): Promise<string | null> {
  try {
    // Try to make a simple HTTP request to detect if it's a web service
    const response = await fetch(`http://localhost:${port}`, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(2000)
    })
    
    const contentType = response.headers.get('content-type')
    const server = response.headers.get('server')
    
    if (contentType?.includes('text/html')) {
      return 'frontend'
    } else if (contentType?.includes('application/json')) {
      return 'api'
    } else if (server?.toLowerCase().includes('nginx')) {
      return 'web-server'
    } else {
      return 'web-service'
    }
  } catch {
    // Not a web service or not accessible
    return null
  }
}

function parseDockerOutput(output: string): Service[] {
  const services: Service[] = []
  const lines = output.split('\n').slice(1) // Skip header
  
  for (const line of lines) {
    if (!line.trim()) continue
    
    const [name, ports] = line.split('\t')
    if (ports && ports.includes('->')) {
      const portMatches = ports.match(/(\d+)->(\d+)/g)
      if (portMatches) {
        for (const match of portMatches) {
          const [hostPort] = match.split('->')
          const port = parseInt(hostPort)
          
          services.push({
            name: name.trim(),
            port,
            type: 'docker-container',
            status: 'running',
            url: `http://localhost:${port}`,
            description: `Docker container: ${name}`
          })
        }
      }
    }
  }
  
  return services
}