import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// 获取单个服务
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const serviceId = parseInt(params.id)
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
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const serviceId = parseInt(params.id)
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
    if (data.healthCheck) {
      await prisma.healthCheckConfig.deleteMany({ where: { serviceId } })
      if (data.healthCheck.enabled) {
        await prisma.healthCheckConfig.create({
          data: {
            serviceId,
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
            headers: data.healthCheck.headers,
            method: data.healthCheck.method,
            body: data.healthCheck.body,
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
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const serviceId = parseInt(params.id)
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