import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// 快速获取服务摘要信息的API
export async function GET() {
  try {
    // 并行执行所有查询
    const [services, stats] = await Promise.all([
      // 只获取最基本的服务信息
      prisma.service.findMany({
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          url: true,
          port: true,
          lastChecked: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      // 使用聚合查询获取统计数据
      prisma.service.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      })
    ])

    // 处理统计数据
    const statsMap = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.status
      return acc
    }, {} as Record<string, number>)

    const finalStats = {
      total: services.length,
      running: statsMap['RUNNING'] || 0,
      stopped: statsMap['STOPPED'] || 0,
      error: statsMap['ERROR'] || 0
    }

    return NextResponse.json({
      services,
      stats: finalStats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('获取服务摘要失败:', error)
    return NextResponse.json({ error: '获取服务摘要失败' }, { status: 500 })
  }
} 