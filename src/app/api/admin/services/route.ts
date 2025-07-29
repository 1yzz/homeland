import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ServiceHealthMonitor } from '@/lib/serviceHealthMonitor'

// 获取所有服务 - 优化版本
export async function GET() {
  try {
    // 只查询基础服务信息，不包含关联数据以提高性能
    const services = await prisma.service.findMany({
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        type: true,
        url: true,
        port: true,
        status: true,
        description: true,
        lastChecked: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    return NextResponse.json(services)
  } catch (error) {
    console.error('获取服务失败:', error)
    return NextResponse.json({ error: '获取服务失败' }, { status: 500 })
  }
}

// 创建新服务
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const serviceHealthMonitor = new ServiceHealthMonitor()
    
    // 验证必填字段
    if (!data.name || !data.type) {
      return NextResponse.json({ error: '服务名称和类型为必填项' }, { status: 400 })
    }

    // 使用事务确保原子性操作
    const service = await prisma.$transaction(async (tx) => {
      // 检查服务名称是否已存在
      const existingService = await tx.service.findUnique({
        where: { name: data.name }
      })

      if (existingService) {
        throw new Error('服务名称已存在')
      }

      // 创建服务
      return await tx.service.create({
        data: {
          name: data.name,
          type: data.type,
          url: data.url,
          port: data.port,
          status: 'STOPPED',
          description: data.description,
        }
      })
    })

    // 创建健康检查配置
    if (data.healthCheck && data.healthCheck.enabled) {
      // 使用用户提供的健康检查配置
      await prisma.healthCheckConfig.create({
        data: {
          serviceId: service.id,
          type: data.healthCheck.type,
          url: data.healthCheck.url,
          port: data.healthCheck.port,
          command: data.healthCheck.command,
          script: data.healthCheck.script,
          timeout: data.healthCheck.timeout,
          interval: data.healthCheck.interval,
          retries: data.healthCheck.retries,
          expectedStatus: data.healthCheck.expectedStatus,
          expectedResponse: data.healthCheck.expectedResponse,
          method: data.healthCheck.method,
          enabled: data.healthCheck.enabled,
        }
      })
    } else if (data.url || data.port) {
      // 如果没有提供健康检查配置但有URL或端口，自动创建
      try {
        const healthCheckConfig = await serviceHealthMonitor.autoDetectHealthCheck(
          data.name,
          data.type,
          data.url
        )
        
        if (healthCheckConfig && healthCheckConfig.type) {
          await prisma.healthCheckConfig.create({
            data: {
              serviceId: service.id,
              type: healthCheckConfig.type,
              url: healthCheckConfig.url || null,
              port: healthCheckConfig.port || null,
              command: healthCheckConfig.command || null,
              script: healthCheckConfig.script || null,
              timeout: healthCheckConfig.timeout || 30000,
              interval: healthCheckConfig.interval || 60000,
              retries: healthCheckConfig.retries || 3,
              expectedStatus: healthCheckConfig.expectedStatus || null,
              expectedResponse: healthCheckConfig.expectedResponse || null,
              method: healthCheckConfig.method || 'GET',
              enabled: healthCheckConfig.enabled !== false,
            }
          })
        }
      } catch (error) {
        console.error('Failed to create auto health check config:', error)
        // 不阻止服务创建，只是记录错误
      }
    }
    
    return NextResponse.json(service, { status: 201 })
  } catch (error: any) {
    console.error('创建服务失败:', error)
    
    // 处理特定的业务错误
    if (error.message === '服务名称已存在') {
      return NextResponse.json({ error: '服务名称已存在' }, { status: 409 })
    }
    
    return NextResponse.json({ error: '创建服务失败' }, { status: 500 })
  }
}