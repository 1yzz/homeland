import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface Context {
  params: { id: string }
}

// 获取单个服务
export async function GET(request: NextRequest, context: Context) {
  try {
    const { id } = context.params
    const serviceId = parseInt(id)
    
    if (isNaN(serviceId)) {
      return NextResponse.json({ error: '无效的服务ID' }, { status: 400 })
    }

    const service = await prisma.Service.findUnique({
      where: { id: serviceId }
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
export async function PUT(request: NextRequest, context: Context) {
  try {
    const { id } = context.params
    const serviceId = parseInt(id)
    const data = await request.json()
    
    if (isNaN(serviceId)) {
      return NextResponse.json({ error: '无效的服务ID' }, { status: 400 })
    }

    // 验证必填字段
    if (!data.name || !data.type) {
      return NextResponse.json({ error: '服务名称和类型为必填项' }, { status: 400 })
    }

    // 检查服务是否存在
    const existingService = await prisma.Service.findUnique({
      where: { id: serviceId }
    })

    if (!existingService) {
      return NextResponse.json({ error: '服务不存在' }, { status: 404 })
    }

    // 如果更改了名称，检查新名称是否已被其他服务使用
    if (data.name !== existingService.name) {
      const nameConflict = await prisma.Service.findFirst({
        where: {
          name: data.name,
          id: { not: serviceId }
        }
      })

      if (nameConflict) {
        return NextResponse.json({ error: '服务名称已存在' }, { status: 409 })
      }
    }

    const service = await prisma.Service.update({
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
    
    return NextResponse.json(service)
  } catch (error) {
    console.error('更新服务失败:', error)
    return NextResponse.json({ error: '更新服务失败' }, { status: 500 })
  }
}

// 删除服务
export async function DELETE(request: NextRequest, context: Context) {
  try {
    const { id } = context.params
    const serviceId = parseInt(id)
    
    if (isNaN(serviceId)) {
      return NextResponse.json({ error: '无效的服务ID' }, { status: 400 })
    }

    // 检查服务是否存在
    const existingService = await prisma.Service.findUnique({
      where: { id: serviceId }
    })

    if (!existingService) {
      return NextResponse.json({ error: '服务不存在' }, { status: 404 })
    }

    await prisma.Service.delete({
      where: { id: serviceId }
    })
    
    return NextResponse.json({ message: '服务删除成功' })
  } catch (error) {
    console.error('删除服务失败:', error)
    return NextResponse.json({ error: '删除服务失败' }, { status: 500 })
  }
}