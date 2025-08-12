import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// 获取单个服务
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const serviceId = parseInt(id)
    if (isNaN(serviceId)) {
      return NextResponse.json({ error: '无效的服务ID' }, { status: 400 })
    }
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        healthChecks: true,
        healthCheckResults: {
          orderBy: { lastChecked: 'desc' },
          take: 1
        }
      }
    })
    if (!service) {
      return NextResponse.json({ error: '服务不存在' }, { status: 404 })
    }
    return NextResponse.json(service)
  } catch (error) {
    console.error('获取服务失败:', error)
    return NextResponse.json({ error: '获取服务失败' }, { status: 500 })
  }
}

// 更新服务
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const serviceId = parseInt(id)
    const data = await request.json()
    if (isNaN(serviceId)) {
      return NextResponse.json({ error: '无效的服务ID' }, { status: 400 })
    }
    if (!data.name || !data.type) {
      return NextResponse.json({ error: '服务名称和类型为必填项' }, { status: 400 })
    }
    const existingService = await prisma.service.findUnique({ where: { id: serviceId } })
    if (!existingService) {
      return NextResponse.json({ error: '服务不存在' }, { status: 404 })
    }
    if (data.name !== existingService.name) {
      const nameConflict = await prisma.service.findFirst({
        where: { name: data.name, id: { not: serviceId } }
      })
      if (nameConflict) {
        return NextResponse.json({ error: '服务名称已存在' }, { status: 409 })
      }
    }
    const service = await prisma.service.update({
      where: { id: serviceId },
      data: {
        name: data.name,
        type: data.type,
        url: data.url,
        port: data.port,
        description: data.description,
        updatedAt: new Date(),
      }
    })
    // 处理健康检查配置更新 - 支持平铺数据结构
    const hasHealthCheckData = data.healthCheckType || data.healthCheckEnabled !== undefined;
    
    if (hasHealthCheckData) {
      // 删除旧的健康检查配置
      await prisma.healthCheckConfig.deleteMany({ where: { serviceId } })
      
      // 如果启用，创建新的健康检查配置
      if (data.healthCheckEnabled) {
        await prisma.healthCheckConfig.create({
          data: {
            serviceId,
            type: data.healthCheckType || 'HTTP',
            url: data.healthCheckUrl || null,
            port: data.healthCheckPort ? parseInt(data.healthCheckPort) : null,
            command: data.healthCheckCommand || null,
            script: data.healthCheckScript || null,
            timeout: data.healthCheckTimeout ? parseInt(data.healthCheckTimeout) : 30000,
            interval: data.healthCheckInterval ? parseInt(data.healthCheckInterval) : 60000,
            retries: data.healthCheckRetries ? parseInt(data.healthCheckRetries) : 3,
            expectedStatus: data.healthCheckExpectedStatus ? parseInt(data.healthCheckExpectedStatus) : null,
            expectedResponse: data.healthCheckExpectedResponse || null,
            method: data.healthCheckMethod || 'GET',
            enabled: data.healthCheckEnabled,
          }
        })
      }
    }
    // 向后兼容嵌套的healthCheck对象结构
    else if (data.healthCheck) {
      await prisma.healthCheckConfig.deleteMany({ where: { serviceId } })
      if (data.healthCheck.enabled) {
        await prisma.healthCheckConfig.create({
          data: {
            serviceId,
            type: data.healthCheck.type || 'HTTP',
            url: data.healthCheck.url || null,
            port: data.healthCheck.port || null,
            command: data.healthCheck.command || null,
            script: data.healthCheck.script || null,
            timeout: data.healthCheck.timeout || 30000,
            interval: data.healthCheck.interval || 60000,
            retries: data.healthCheck.retries || 3,
            expectedStatus: data.healthCheck.expectedStatus || null,
            expectedResponse: data.healthCheck.expectedResponse || null,
            method: data.healthCheck.method || 'GET',
            enabled: data.healthCheck.enabled,
          }
        })
      }
    }
    return NextResponse.json(service)
  } catch (error) {
    console.error('更新服务失败:', error)
    return NextResponse.json({ error: '更新服务失败' }, { status: 500 })
  }
}

// 删除服务
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const serviceId = parseInt(id)
    if (isNaN(serviceId)) {
      return NextResponse.json({ error: '无效的服务ID' }, { status: 400 })
    }
    const existingService = await prisma.service.findUnique({ where: { id: serviceId } })
    if (!existingService) {
      return NextResponse.json({ error: '服务不存在' }, { status: 404 })
    }
    await prisma.service.delete({ where: { id: serviceId } })
    return NextResponse.json({ message: '服务删除成功' })
  } catch (error) {
    console.error('删除服务失败:', error)
    return NextResponse.json({ error: '删除服务失败' }, { status: 500 })
  }
}