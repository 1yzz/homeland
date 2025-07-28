import { exec } from 'child_process';
import { promisify } from 'util';

// 定义服务类型枚举
export enum ServiceType {
  HTTP = 'HTTP',
  GRPC = 'GRPC',
  SYSTEMD = 'SYSTEMD',
  SUPERVISORD = 'SUPERVISORD',
  DOCKER = 'DOCKER',
  DATABASE = 'DATABASE',
  CACHE = 'CACHE',
  CUSTOM = 'CUSTOM'
}

const execAsync = promisify(exec);

export interface HealthCheckConfig {
  id: number;
  serviceId: number;
  type: 'HTTP' | 'TCP' | 'COMMAND' | 'SCRIPT';
  url?: string;
  port?: number;
  command?: string;
  script?: string;
  timeout: number;
  interval: number;
  retries: number;
  expectedStatus?: number;
  expectedResponse?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthCheckResult {
  serviceId: number;
  status: 'HEALTHY' | 'UNHEALTHY' | 'UNKNOWN';
  responseTime: number;
  lastChecked: Date;
  error?: string;
  details?: {
    statusCode?: number;
    responseBody?: string;
    commandOutput?: string;
  };
}

export interface ServiceHealthStatus {
  serviceId: number;
  serviceName: string;
  serviceType: ServiceType;
  isHealthy: boolean;
  lastHealthCheck: Date;
  uptime?: string;
  responseTime?: number;
  errorCount: number;
  successCount: number;
  healthScore: number; // 0-100
}

export class ServiceHealthMonitor {
  private healthChecks: Map<number, HealthCheckConfig> = new Map();
  private results: Map<number, HealthCheckResult> = new Map();
  private timers: Map<number, NodeJS.Timeout> = new Map();
  private syncedResults: Set<string> = new Set(); // 记录已同步的结果

  /**
   * 根据服务类型自动检测健康检查方法
   */
  async autoDetectHealthCheck(serviceName: string, serviceType: ServiceType, serviceUrl?: string): Promise<Partial<HealthCheckConfig>> {
    switch (serviceType) {
      case 'HTTP':
        return await this.detectHTTPHealthCheck(serviceName, serviceUrl);
      case 'GRPC':
        return await this.detectGRPCHealthCheck(serviceName);
      case 'SYSTEMD':
        return await this.detectSystemdHealthCheck(serviceName);
      case 'SUPERVISORD':
        return await this.detectSupervisordHealthCheck(serviceName);
      case 'DOCKER':
        return await this.detectDockerHealthCheck(serviceName);
      case 'DATABASE':
        return await this.detectDatabaseHealthCheck(serviceName);
      case 'CACHE':
        return await this.detectCacheHealthCheck(serviceName);
      default:
        return await this.detectCustomHealthCheck(serviceName);
    }
  }

  /**
   * 检测HTTP服务健康检查
   */
  private async detectHTTPHealthCheck(serviceName: string, serviceUrl?: string): Promise<Partial<HealthCheckConfig>> {
    // 如果提供了服务URL，优先使用
    if (serviceUrl) {
      try {
        const response = await fetch(serviceUrl, { 
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        
        return {
          type: 'HTTP',
          url: serviceUrl,
          timeout: 10000,
          interval: 60000,
          retries: 3,
          expectedStatus: response.ok ? 200 : response.status,
          method: 'GET',
          enabled: true
        };
      } catch (error) {
        // 如果配置的URL失败，返回配置但标记为可能有问题
        return {
          type: 'HTTP',
          url: serviceUrl,
          timeout: 10000,
          interval: 60000,
          retries: 3,
          expectedStatus: 200,
          method: 'GET',
          enabled: true
        };
      }
    }

    // 如果没有提供URL，返回空配置，要求用户手动配置
    return {
      type: 'HTTP',
      url: '',
      timeout: 10000,
      interval: 60000,
      retries: 3,
      expectedStatus: 200,
      method: 'GET',
      enabled: false // 默认禁用，直到用户配置正确的URL
    };
  }

  /**
   * 检测gRPC服务健康检查
   */
  private async detectGRPCHealthCheck(serviceName: string): Promise<Partial<HealthCheckConfig>> {
    const commonPorts = [50051, 9090, 9091, 9092];
    
    for (const port of commonPorts) {
      try {
        // 使用grpcurl检查gRPC服务
        const { stdout } = await execAsync(`grpcurl -plaintext localhost:${port} list`);
        if (stdout) {
          return {
            type: 'COMMAND',
            command: `grpcurl -plaintext localhost:${port} grpc.health.v1.Health/Check`,
            port,
            timeout: 10000,
            interval: 60000,
            retries: 3,
            enabled: true
          };
        }
      } catch (error) {
        // 继续尝试下一个端口
      }
    }

    return {
      type: 'COMMAND',
      command: `grpcurl -plaintext localhost:50051 grpc.health.v1.Health/Check`,
      timeout: 10000,
      interval: 60000,
      retries: 3,
      enabled: true
    };
  }

  /**
   * 检测Systemd服务健康检查
   */
  private async detectSystemdHealthCheck(serviceName: string): Promise<Partial<HealthCheckConfig>> {
    return {
      type: 'COMMAND',
      command: `systemctl is-active ${serviceName}`,
      timeout: 5000,
      interval: 60000,
      retries: 3,
      expectedResponse: 'active',
      enabled: true
    };
  }

  /**
   * 检测Supervisord服务健康检查
   */
  private async detectSupervisordHealthCheck(serviceName: string): Promise<Partial<HealthCheckConfig>> {
    return {
      type: 'COMMAND',
      command: `supervisorctl status ${serviceName}`,
      timeout: 5000,
      interval: 60000,
      retries: 3,
      expectedResponse: 'RUNNING',
      enabled: true
    };
  }

  /**
   * 检测Docker容器健康检查
   */
  private async detectDockerHealthCheck(serviceName: string): Promise<Partial<HealthCheckConfig>> {
    return {
      type: 'COMMAND',
      command: `docker ps --filter name=${serviceName} --format "table {{.Status}}"`,
      timeout: 10000,
      interval: 60000,
      retries: 3,
      enabled: true
    };
  }

  /**
   * 检测数据库服务健康检查
   */
  private async detectDatabaseHealthCheck(serviceName: string): Promise<Partial<HealthCheckConfig>> {
    const dbChecks = {
      'mongod': 'mongosh --eval "db.runCommand({ping: 1})"',
      'mysql': 'mysqladmin ping -h localhost',
      'postgres': 'pg_isready -h localhost',
      'redis': 'redis-cli ping',
      'elasticsearch': 'curl -s http://localhost:9200/_cluster/health'
    };

    const command = dbChecks[serviceName as keyof typeof dbChecks];
    if (command) {
      return {
        type: 'COMMAND',
        command,
        timeout: 10000,
        interval: 60000,
        retries: 3,
        enabled: true
      };
    }

    return {
      type: 'COMMAND',
      command: `systemctl is-active ${serviceName}`,
      timeout: 5000,
      interval: 60000,
      retries: 3,
      enabled: true
    };
  }

  /**
   * 检测缓存服务健康检查
   */
  private async detectCacheHealthCheck(serviceName: string): Promise<Partial<HealthCheckConfig>> {
    const cacheChecks = {
      'redis': 'redis-cli ping',
      'memcached': 'echo "stats" | nc localhost 11211',
      'hazelcast': 'curl -s http://localhost:5701/hazelcast/health'
    };

    const command = cacheChecks[serviceName as keyof typeof cacheChecks];
    if (command) {
      return {
        type: 'COMMAND',
        command,
        timeout: 5000,
        interval: 60000,
        retries: 3,
        enabled: true
      };
    }

    return {
      type: 'COMMAND',
      command: `systemctl is-active ${serviceName}`,
      timeout: 5000,
      interval: 60000,
      retries: 3,
      enabled: true
    };
  }

  /**
   * 检测自定义服务健康检查
   */
  private async detectCustomHealthCheck(serviceName: string): Promise<Partial<HealthCheckConfig>> {
    // 尝试检测常见的自定义服务
    const customChecks = [
      `systemctl is-active ${serviceName}`,
      `pgrep -f ${serviceName}`,
      `ps aux | grep ${serviceName} | grep -v grep`
    ];

    for (const command of customChecks) {
      try {
        await execAsync(command);
        return {
          type: 'COMMAND',
          command,
          timeout: 5000,
          interval: 60000,
          retries: 3,
          enabled: true
        };
      } catch (error) {
        // 继续尝试下一个命令
      }
    }

    return {
      type: 'COMMAND',
      command: `systemctl is-active ${serviceName}`,
      timeout: 5000,
      interval: 60000,
      retries: 3,
      enabled: true
    };
  }

  /**
   * 执行HTTP健康检查
   */
  private async performHTTPHealthCheck(config: HealthCheckConfig): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(config.url!, {
        method: config.method || 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      const isHealthy = response.status === (config.expectedStatus || 200);
      
      return {
        serviceId: config.serviceId,
        status: isHealthy ? 'HEALTHY' : 'UNHEALTHY',
        responseTime,
        lastChecked: new Date(),
        details: {
          statusCode: response.status,
          responseBody: await response.text()
        }
      };
    } catch (error: any) {
      return {
        serviceId: config.serviceId,
        status: 'UNHEALTHY',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        error: error.message,
        details: {
          responseBody: error.message
        }
      };
    }
  }

  /**
   * 执行TCP健康检查
   */
  private async performTCPHealthCheck(config: HealthCheckConfig): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      const command = `timeout ${config.timeout / 1000} bash -c "</dev/tcp/localhost/${config.port}"`;
      await execAsync(command);

      const responseTime = Date.now() - startTime;
      
      return {
        serviceId: config.serviceId,
        status: 'HEALTHY',
        responseTime,
        lastChecked: new Date()
      };
    } catch (error: any) {
      return {
        serviceId: config.serviceId,
        status: 'UNHEALTHY',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        error: error.message
      };
    }
  }

  /**
   * 执行命令健康检查
   */
  private async performCommandHealthCheck(config: HealthCheckConfig): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const { stdout, stderr } = await execAsync(config.command!, { 
        timeout: config.timeout 
      });

      const responseTime = Date.now() - startTime;
      const output = stdout.trim();
      
      let isHealthy = true;
      if (config.expectedResponse) {
        isHealthy = output.includes(config.expectedResponse);
      } else {
        isHealthy = !stderr && output.length > 0;
      }

      return {
        serviceId: config.serviceId,
        status: isHealthy ? 'HEALTHY' : 'UNHEALTHY',
        responseTime,
        lastChecked: new Date(),
        details: {
          commandOutput: output
        }
      };
    } catch (error: any) {
      return {
        serviceId: config.serviceId,
        status: 'UNHEALTHY',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        error: error.message
      };
    }
  }

  /**
   * 执行脚本健康检查
   */
  private async performScriptHealthCheck(config: HealthCheckConfig): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const { stdout, stderr } = await execAsync(config.script!, { 
        timeout: config.timeout 
      });

      const responseTime = Date.now() - startTime;
      const output = stdout.trim();
      
      // 脚本应该返回0退出码表示健康
      const isHealthy = output.length > 0 && !stderr;

      return {
        serviceId: config.serviceId,
        status: isHealthy ? 'HEALTHY' : 'UNHEALTHY',
        responseTime,
        lastChecked: new Date(),
        details: {
          commandOutput: output
        }
      };
    } catch (error: any) {
      return {
        serviceId: config.serviceId,
        status: 'UNHEALTHY',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        error: error.message
      };
    }
  }

  /**
   * 执行健康检查
   */
  async performHealthCheck(config: HealthCheckConfig): Promise<HealthCheckResult> {
    let result: HealthCheckResult;
    
    switch (config.type) {
      case 'HTTP':
        result = await this.performHTTPHealthCheck(config);
        break;
      case 'TCP':
        result = await this.performTCPHealthCheck(config);
        break;
      case 'COMMAND':
        result = await this.performCommandHealthCheck(config);
        break;
      case 'SCRIPT':
        result = await this.performScriptHealthCheck(config);
        break;
      default:
        throw new Error(`Unsupported health check type: ${config.type}`);
    }
    
    // 将结果保存到内存中（用于定期同步）
    this.results.set(config.serviceId, result);
    
    return result;
  }

  /**
   * 开始监控服务
   */
  startMonitoring(config: HealthCheckConfig): void {
    // 停止现有的监控
    this.stopMonitoring(config.serviceId);

    // 立即执行一次检查
    this.performHealthCheck(config).then(result => {
      this.results.set(config.serviceId, result);
    });

    // 设置定时器
    const timer = setInterval(async () => {
      try {
        const result = await this.performHealthCheck(config);
        this.results.set(config.serviceId, result);
      } catch (error) {
        console.error(`Health check error for service ${config.serviceId}:`, error);
      }
    }, config.interval);

    this.timers.set(config.serviceId, timer);
    this.healthChecks.set(config.serviceId, config);
  }

  /**
   * 停止监控服务
   */
  stopMonitoring(serviceId: number): void {
    const timer = this.timers.get(serviceId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(serviceId);
      this.healthChecks.delete(serviceId);
    }
  }

  /**
   * 获取健康检查结果
   */
  getHealthResult(serviceId: number): HealthCheckResult | undefined {
    return this.results.get(serviceId);
  }

  /**
   * 获取所有健康检查结果
   */
  getAllHealthResults(): HealthCheckResult[] {
    return Array.from(this.results.values());
  }

  /**
   * 获取监控的服务列表
   */
  getMonitoredServices(): number[] {
    return Array.from(this.timers.keys());
  }

  /**
   * 将内存中的健康检查结果同步到数据库
   */
  async syncResultsToDatabase(): Promise<void> {
    try {
      // 动态导入 prisma 避免循环依赖
      const { prisma } = await import('@/lib/db');
      
      const results = this.getAllHealthResults();
      let syncedCount = 0;
      let errorCount = 0;

      for (const result of results) {
        try {
          // 创建唯一标识符
          const resultId = `${result.serviceId}-${result.lastChecked.getTime()}-${result.status}`;
          
          // 检查是否已经同步过这个结果
          if (this.syncedResults.has(resultId)) {
            continue;
          }

          // 只同步错误状态的结果到数据库
          if (result.status === 'UNHEALTHY') {
            await prisma.healthCheckResult.create({
              data: {
                serviceId: result.serviceId,
                status: result.status,
                responseTime: result.responseTime,
                lastChecked: result.lastChecked,
                error: result.error,
                details: result.details
              }
            });
            errorCount++;
          }

          // 更新服务状态
          const serviceStatus = result.status === 'HEALTHY' ? 'RUNNING' : 'ERROR';
          await prisma.service.update({
            where: { id: result.serviceId },
            data: { 
              status: serviceStatus,
              lastChecked: result.lastChecked
            }
          });

          // 标记为已同步
          this.syncedResults.add(resultId);
          syncedCount++;

        } catch (error) {
          console.error(`Failed to sync result for service ${result.serviceId}:`, error);
        }
      }

      if (syncedCount > 0) {
        console.log(`Synced ${syncedCount} results to database (${errorCount} errors recorded)`);
      }

      // 清理旧的同步记录（避免内存泄漏）
      if (this.syncedResults.size > 1000) {
        const oldEntries = Array.from(this.syncedResults).slice(0, 500);
        oldEntries.forEach(entry => this.syncedResults.delete(entry));
      }

    } catch (error) {
      console.error('Failed to sync health check results to database:', error);
    }
  }

  /**
   * 清理旧的内存结果（保留最新的结果）
   */
  cleanupMemoryResults(): void {
    // 只保留每个服务的最新结果
    const latestResults = new Map<number, HealthCheckResult>();
    
    for (const [serviceId, result] of this.results) {
      const existing = latestResults.get(serviceId);
      if (!existing || result.lastChecked > existing.lastChecked) {
        latestResults.set(serviceId, result);
      }
    }
    
    this.results = latestResults;
    console.log(`Cleaned up memory results, kept ${latestResults.size} latest results`);
  }

  /**
   * 停止所有监控
   */
  stopAllMonitoring(): void {
    for (const serviceId of this.timers.keys()) {
      this.stopMonitoring(serviceId);
    }
  }
}

// 创建默认实例
export const serviceHealthMonitor = new ServiceHealthMonitor();

// 全局定时监控管理器
export class GlobalHealthMonitor {
  private static instance: GlobalHealthMonitor;
  private isRunning: boolean = false;
  private globalTimer: NodeJS.Timeout | null = null;
  private syncTimer: NodeJS.Timeout | null = null;
  private prisma: any;

  private constructor() {}

  static getInstance(): GlobalHealthMonitor {
    if (!GlobalHealthMonitor.instance) {
      GlobalHealthMonitor.instance = new GlobalHealthMonitor();
    }
    return GlobalHealthMonitor.instance;
  }

  /**
   * 启动全局监控
   */
  async startGlobalMonitoring() {
    if (this.isRunning) {
      console.log('Global monitoring is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting global health monitoring...');

    // 立即执行一次检查
    await this.performGlobalHealthCheck();

    // 设置定时器，每1分钟检查一次
    this.globalTimer = setInterval(async () => {
      await this.performGlobalHealthCheck();
    }, 60000); // 1分钟间隔

    // 设置独立的同步定时器，每5分钟同步一次
    this.syncTimer = setInterval(async () => {
      await serviceHealthMonitor.syncResultsToDatabase();
      serviceHealthMonitor.cleanupMemoryResults();
    }, 300000); // 5分钟间隔
  }

  /**
   * 停止全局监控
   */
  stopGlobalMonitoring() {
    if (!this.isRunning) {
      console.log('Global monitoring is not running');
      return;
    }

    this.isRunning = false;
    if (this.globalTimer) {
      clearInterval(this.globalTimer);
      this.globalTimer = null;
    }
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    console.log('Global health monitoring and sync stopped');
  }

  /**
   * 执行全局健康检查
   */
  private async performGlobalHealthCheck() {
    try {
      // 动态导入 prisma 避免循环依赖
      const { prisma } = await import('@/lib/db');
      this.prisma = prisma;

      // 获取所有启用的健康检查配置
      const healthConfigs = await this.prisma.healthCheckConfig.findMany({
        where: { enabled: true },
        include: {
          service: true
        }
      });

      console.log(`Performing health checks for ${healthConfigs.length} services...`);

      // 清理24小时前的旧数据
      await this.cleanupOldResults();

      // 并行执行所有健康检查
      const healthPromises = healthConfigs.map(async (config: any) => {
        try {
          const result = await serviceHealthMonitor.performHealthCheck(config);
          
          // 只在检查失败时保存记录到数据库
          if (result.status === 'UNHEALTHY') {
            await this.prisma.healthCheckResult.create({
              data: {
                serviceId: config.serviceId,
                status: result.status,
                responseTime: result.responseTime,
                lastChecked: result.lastChecked,
                error: result.error,
                details: result.details
              }
            });
            
            console.log(`Service ${config.service.name} (${config.serviceId}): ${result.status} - ${result.error}`);
          }

          // 更新服务状态
          const serviceStatus = result.status === 'HEALTHY' ? 'RUNNING' : 'ERROR';
          await this.prisma.service.update({
            where: { id: config.serviceId },
            data: { 
              status: serviceStatus,
              lastChecked: new Date()
            }
          });

          return { serviceId: config.serviceId, status: result.status };
        } catch (error) {
          console.error(`Health check failed for service ${config.serviceId}:`, error);
          
          // 记录错误结果
          await this.prisma.healthCheckResult.create({
            data: {
              serviceId: config.serviceId,
              status: 'UNHEALTHY',
              responseTime: 0,
              lastChecked: new Date(),
              error: error instanceof Error ? error.message : 'Unknown error',
              details: { error: error }
            }
          });

          // 更新服务状态为错误
          await this.prisma.service.update({
            where: { id: config.serviceId },
            data: { 
              status: 'ERROR',
              lastChecked: new Date()
            }
          });

          return { serviceId: config.serviceId, status: 'UNHEALTHY' };
        }
      });

      const results = await Promise.allSettled(healthPromises);
      const successfulChecks = results.filter(r => r.status === 'fulfilled').length;
      const failedChecks = results.filter(r => r.status === 'rejected').length;

      console.log(`Health check completed: ${successfulChecks} successful, ${failedChecks} failed`);
    } catch (error) {
      console.error('Global health check error:', error);
    }
  }

  /**
   * 清理24小时前的旧健康检查数据
   */
  private async cleanupOldResults() {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const deletedCount = await this.prisma.healthCheckResult.deleteMany({
        where: {
          lastChecked: {
            lt: oneDayAgo
          }
        }
      });

      if (deletedCount.count > 0) {
        console.log(`Cleaned up ${deletedCount.count} old health check results`);
      }
    } catch (error) {
      console.error('Failed to cleanup old health check results:', error);
    }
  }

  /**
   * 获取监控状态
   */
  isMonitoring(): boolean {
    return this.isRunning;
  }

  /**
   * 手动触发一次全局健康检查
   */
  async triggerHealthCheck() {
    await this.performGlobalHealthCheck();
  }
}

// 创建全局监控实例
export const globalHealthMonitor = GlobalHealthMonitor.getInstance(); 