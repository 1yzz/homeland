import { NextRequest, NextResponse } from 'next/server';
import { serviceHealthMonitor, ServiceType, globalHealthMonitor } from '@/lib/serviceHealthMonitor';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const action = searchParams.get('action');

    if (serviceId) {
      const id = parseInt(serviceId);
      
      switch (action) {
        case 'config':
          // 获取服务的健康检查配置
          const config = await prisma.healthCheckConfig.findFirst({
            where: { serviceId: id }
          });
          return NextResponse.json(config || { error: 'No health check config found' });

        case 'result':
          // 获取最新的健康检查结果
          const result = await prisma.healthCheckResult.findFirst({
            where: { serviceId: id },
            orderBy: { lastChecked: 'desc' }
          });
          return NextResponse.json(result || { error: 'No health check result found' });

        case 'status':
          // 执行实时健康检查
          const service = await prisma.service.findUnique({
            where: { id },
            include: { healthChecks: true }
          });
          
          if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
          }

          if (service.healthChecks.length === 0) {
            return NextResponse.json({ 
              status: 'UNKNOWN',
              message: 'No health check configured'
            });
          }

          const healthCheck = service.healthChecks[0];
          // 转换数据库类型到监控器期望的类型
          const monitorConfig = {
            ...healthCheck,
            url: healthCheck.url || undefined,
            port: healthCheck.port || undefined,
            command: healthCheck.command || undefined,
            script: healthCheck.script || undefined,
            method: healthCheck.method || undefined,
            expectedStatus: healthCheck.expectedStatus || undefined,
            expectedResponse: healthCheck.expectedResponse || undefined
          };
          const healthResult = await serviceHealthMonitor.performHealthCheck(monitorConfig);
          
          // 结果由定期同步机制处理，这里只返回结果
          return NextResponse.json(healthResult);

        default:
          // 默认返回服务状态
          const serviceStatus = await prisma.service.findUnique({
            where: { id },
            include: { 
              healthChecks: true,
              healthCheckResults: {
                orderBy: { lastChecked: 'desc' },
                take: 1
              }
            }
          });
          
          return NextResponse.json(serviceStatus);
      }
    } else {
      // 检查是否是全局监控相关请求
      if (action === 'global-status') {
        return NextResponse.json({
          isMonitoring: globalHealthMonitor.isMonitoring()
        });
      }

      // 获取所有服务的健康状态
      const services = await prisma.service.findMany({
        include: {
          healthChecks: true,
          healthCheckResults: {
            orderBy: { lastChecked: 'desc' },
            take: 1
          }
        }
      });

      return NextResponse.json(services);
    }
  } catch (error) {
    console.error('Service monitor API error:', error);
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

    // 全局监控操作
    if (action === 'start-global-monitoring') {
      await globalHealthMonitor.startGlobalMonitoring();
      return NextResponse.json({ 
        message: 'Global monitoring started',
        isMonitoring: true
      });
    }

    if (action === 'stop-global-monitoring') {
      globalHealthMonitor.stopGlobalMonitoring();
      return NextResponse.json({ 
        message: 'Global monitoring stopped',
        isMonitoring: false
      });
    }

    if (action === 'trigger-health-check') {
      await globalHealthMonitor.triggerHealthCheck();
      return NextResponse.json({ 
        message: 'Health check triggered',
        timestamp: new Date().toISOString()
      });
    }

    if (serviceId) {
      const id = parseInt(serviceId);
      
      switch (action) {
      case 'auto-detect':
        // 自动检测服务健康检查配置
        const { serviceId, serviceType } = body;
        if (!serviceId || !serviceType) {
          return NextResponse.json(
            { error: 'Service ID and type are required' },
            { status: 400 }
          );
        }

          // 获取服务信息以获取URL和端口
          const serviceInfo = await prisma.service.findUnique({
            where: { id: serviceId }
          });

          if (!serviceInfo) {
            return NextResponse.json(
              { error: 'Service not found' },
              { status: 404 }
            );
          }

        const detectedConfig = await serviceHealthMonitor.autoDetectHealthCheck(
            serviceInfo.name, 
            serviceType as ServiceType,
            serviceInfo.url || undefined
        );

        if (detectedConfig) {
          const config = await prisma.healthCheckConfig.create({
            data: {
              serviceId,
              type: detectedConfig.type!,
              url: detectedConfig.url,
              port: detectedConfig.port,
              command: detectedConfig.command,
              script: detectedConfig.script,
              timeout: detectedConfig.timeout || 10000,
              interval: detectedConfig.interval || 30000,
              retries: detectedConfig.retries || 3,
              expectedStatus: detectedConfig.expectedStatus,
              expectedResponse: detectedConfig.expectedResponse,
              method: detectedConfig.method,
              enabled: detectedConfig.enabled || true
            }
          });
          return NextResponse.json(config);
        }

        return NextResponse.json(
          { error: 'Failed to auto-detect health check configuration' },
          { status: 400 }
        );

        case 'create-config':
          // 创建健康检查配置
          if (!config) {
            return NextResponse.json(
              { error: 'Health check config is required' },
              { status: 400 }
            );
          }

          const newConfig = await prisma.healthCheckConfig.create({
            data: {
              serviceId: id,
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
              method: config.method || 'GET',
              enabled: config.enabled !== false
            }
          });

          return NextResponse.json(newConfig);

        case 'update-config':
          // 更新健康检查配置
          if (!config) {
            return NextResponse.json(
              { error: 'Health check config is required' },
              { status: 400 }
            );
          }

          const updatedConfig = await prisma.healthCheckConfig.updateMany({
            where: { serviceId: id },
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
              method: config.method,
              enabled: config.enabled
            }
          });

          return NextResponse.json({ message: 'Health check config updated', count: updatedConfig.count });

        case 'start-monitoring':
          // 启动服务监控
          const startConfig = await prisma.healthCheckConfig.findFirst({
            where: { serviceId: id, enabled: true }
          });

          if (!startConfig) {
            return NextResponse.json(
              { error: 'No enabled health check config found' },
              { status: 404 }
            );
          }

          serviceHealthMonitor.startMonitoring({
            ...startConfig,
            url: startConfig.url || undefined,
            port: startConfig.port || undefined,
            command: startConfig.command || undefined,
            script: startConfig.script || undefined,
            expectedStatus: startConfig.expectedStatus || undefined,
            expectedResponse: startConfig.expectedResponse || undefined,
            method: startConfig.method || undefined
          });
          return NextResponse.json({ message: 'Service monitoring started' });

        case 'stop-monitoring':
          // 停止服务监控
          serviceHealthMonitor.stopMonitoring(id);
          return NextResponse.json({ message: 'Service monitoring stopped' });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Service monitor API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 