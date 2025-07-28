import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { serviceHealthMonitor } from '@/lib/serviceHealthMonitor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const action = searchParams.get('action');

    if (serviceId) {
      const id = parseInt(serviceId);
      
      switch (action) {
        case 'config':
          // 获取健康检查配置
          const config = await prisma.healthCheckConfig.findFirst({
            where: { serviceId: id }
          });
          return NextResponse.json(config || null);

        case 'result':
          // 获取健康检查结果
          const result = await prisma.healthCheckResult.findFirst({
            where: { serviceId: id },
            orderBy: { lastChecked: 'desc' }
          });
          return NextResponse.json(result || null);

        case 'status':
          // 获取服务健康状态
          const service = await prisma.service.findUnique({
            where: { id },
            include: {
              healthChecks: true,
              healthCheckResults: {
                orderBy: { lastChecked: 'desc' },
                take: 1
              }
            }
          });
          
          if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
          }

          const latestResult = service.healthCheckResults[0];
          const isHealthy = latestResult?.status === 'HEALTHY';
          
          return NextResponse.json({
            serviceId: id,
            serviceName: service.name,
            serviceType: service.type,
            isHealthy,
            lastHealthCheck: latestResult?.lastChecked,
            responseTime: latestResult?.responseTime,
            errorCount: await prisma.healthCheckResult.count({
              where: { 
                serviceId: id,
                status: 'UNHEALTHY',
                lastChecked: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 最近24小时
              }
            }),
            successCount: await prisma.healthCheckResult.count({
              where: { 
                serviceId: id,
                status: 'HEALTHY',
                lastChecked: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 最近24小时
              }
            })
          });

        default:
          // 执行健康检查
          const healthConfig = await prisma.healthCheckConfig.findFirst({
            where: { serviceId: id, enabled: true }
          });
          
          if (!healthConfig) {
            return NextResponse.json({ error: 'No health check configuration found' }, { status: 404 });
          }

          const healthResult = await serviceHealthMonitor.performHealthCheck(healthConfig);
          
          // 结果由定期同步机制处理，这里只返回结果
          return NextResponse.json(healthResult);
      }
    }

    // 获取所有服务的健康状态
    const services = await prisma.Service.findMany({
      include: {
        healthChecks: true,
        healthCheckResults: {
          orderBy: { lastChecked: 'desc' },
          take: 1
        }
      }
    });

    const healthStatuses = services.map(service => {
      const latestResult = service.healthCheckResults[0];
      const isHealthy = latestResult?.status === 'HEALTHY';
      
      return {
        serviceId: service.id,
        serviceName: service.name,
        serviceType: service.type,
        isHealthy,
        lastHealthCheck: latestResult?.lastChecked,
        responseTime: latestResult?.responseTime,
        hasHealthCheck: service.healthChecks.length > 0
      };
    });

    return NextResponse.json(healthStatuses);
  } catch (error) {
    console.error('Health check API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceId, action, config } = body;

    switch (action) {
      case 'auto-detect':
        // 自动检测健康检查配置
        const service = await prisma.service.findUnique({
          where: { id: serviceId }
        });
        
        if (!service) {
          return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }

        const detectedConfig = await serviceHealthMonitor.autoDetectHealthCheck(
          service.name,
          service.type,
          service.url || undefined
        );

        return NextResponse.json(detectedConfig);

      case 'create-config':
        // 创建健康检查配置
        const newConfig = await prisma.healthCheckConfig.create({
          data: {
            serviceId,
            type: config.type,
            url: config.url,
            port: config.port,
            command: config.command,
            script: config.script,
            timeout: config.timeout || 10000,
            interval: config.interval || 30000,
            retries: config.retries || 3,
            expectedStatus: config.expectedStatus,
            expectedResponse: config.expectedResponse,
            headers: config.headers,
            method: config.method || 'GET',
            body: config.body,
            enabled: config.enabled !== false
          }
        });

        return NextResponse.json(newConfig);

      case 'update-config':
        // 更新健康检查配置
        const updatedConfig = await prisma.healthCheckConfig.update({
          where: { id: config.id },
          data: {
            type: config.type,
            url: config.url,
            port: config.port,
            command: config.command,
            script: config.script,
            timeout: config.timeout,
            interval: config.interval,
            retries: config.retries,
            expectedStatus: config.expectedStatus,
            expectedResponse: config.expectedResponse,
            headers: config.headers,
            method: config.method,
            body: config.body,
            enabled: config.enabled
          }
        });

        return NextResponse.json(updatedConfig);

      case 'start-monitoring':
        // 开始监控
        const healthConfig = await prisma.healthCheckConfig.findFirst({
          where: { serviceId, enabled: true }
        });
        
        if (!healthConfig) {
          return NextResponse.json({ error: 'No health check configuration found' }, { status: 404 });
        }

        serviceHealthMonitor.startMonitoring(healthConfig);
        
        return NextResponse.json({ message: 'Monitoring started' });

      case 'stop-monitoring':
        // 停止监控
        serviceHealthMonitor.stopMonitoring(serviceId);
        
        return NextResponse.json({ message: 'Monitoring stopped' });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Health check API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 