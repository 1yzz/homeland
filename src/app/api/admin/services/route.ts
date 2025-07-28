import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// 获取所有服务
export async function GET() {
  try {
    const services = await prisma.service.findMany({
      orderBy: {
        name: 'asc'
      },
      include: {
        healthChecks: true,
        healthCheckResults: {
          orderBy: { lastChecked: 'desc' },
          take: 1
        }
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
    
    // 验证必填字段
    if (!data.name || !data.type) {
      return NextResponse.json({ error: '服务名称和类型为必填项' }, { status: 400 })
    }

    // 检查服务名称是否已存在
    const existingService = await prisma.service.findUnique({
      where: { name: data.name }
    })

    if (existingService) {
      return NextResponse.json({ error: '服务名称已存在' }, { status: 409 })
    }

    // 创建服务
    const service = await prisma.service.create({
      data: {
        name: data.name,
        type: data.type,
        url: data.url,
        port: data.port,
        status: 'STOPPED',
        description: data.description,
      }
    })

    // 如果提供了健康检查配置，创建健康检查
    if (data.healthCheck && data.healthCheck.enabled) {
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
    }
    
    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('创建服务失败:', error)
    return NextResponse.json({ error: '创建服务失败' }, { status: 500 })
  }
}