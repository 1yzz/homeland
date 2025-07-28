import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { stopService } from '@/lib/serviceControl'

interface Context {
  params: { id: string }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const { id } = context.params
    const serviceId = parseInt(id)
    
    if (isNaN(serviceId)) {
      return NextResponse.json({ error: '无效的服务ID' }, { status: 400 })
    }

    // 获取服务信息
    const service = await prisma.Service.findUnique({
      where: { id: serviceId }
    })

    if (!service) {
      return NextResponse.json({ error: '服务不存在' }, { status: 404 })
    }

    // 更新状态为停止中
    await prisma.Service.update({
      where: { id: serviceId },
      data: {
        status: 'STOPPING',
        lastChecked: new Date(),
      }
    })

    try {
      // 执行停止命令
      const result = await stopService(service)
      
      // 更新状态为已停止
      const updatedService = await prisma.Service.update({
        where: { id: serviceId },
        data: {
          status: 'STOPPED',
          lastChecked: new Date(),
        }
      })

      return NextResponse.json({
        message: '服务停止成功',
        service: updatedService,
        output: result.output
      })
    } catch (error: any) {
      // 停止失败，更新状态为错误
      await prisma.Service.update({
        where: { id: serviceId },
        data: {
          status: 'ERROR',
          lastChecked: new Date(),
        }
      })

      return NextResponse.json({
        error: `服务停止失败: ${error.message}`,
        output: error.output
      }, { status: 500 })
    }
  } catch (error) {
    console.error('停止服务失败:', error)
    return NextResponse.json({ error: '停止服务失败' }, { status: 500 })
  }
}