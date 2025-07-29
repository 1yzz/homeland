import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// 获取所有服务的详细信息（包含健康检查数据）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceIds = searchParams.get('ids')?.split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
    
    // 构建查询条件
    const whereCondition = serviceIds && serviceIds.length > 0 
      ? { id: { in: serviceIds } }
      : {}

    const services = await prisma.service.findMany({
      where: whereCondition,
      orderBy: {
        name: 'asc'
      },
      include: {
        healthChecks: {
          where: { enabled: true }
        },
        healthCheckResults: {
          orderBy: { lastChecked: 'desc' },
          take: 1
        }
      }
    })
    
    return NextResponse.json(services)
  } catch (error) {
    console.error('获取服务详细信息失败:', error)
    return NextResponse.json({ error: '获取服务详细信息失败' }, { status: 500 })
  }
} 