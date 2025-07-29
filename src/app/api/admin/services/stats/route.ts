import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// 获取服务统计信息
export async function GET() {
  try {
    // 使用聚合查询提高性能
    const [total, running, stopped, error] = await Promise.all([
      prisma.service.count(),
      prisma.service.count({ where: { status: 'RUNNING' } }),
      prisma.service.count({ where: { status: 'STOPPED' } }),
      prisma.service.count({ where: { status: 'ERROR' } })
    ])
    
    return NextResponse.json({
      total,
      running,
      stopped,
      error
    })
  } catch (error) {
    console.error('获取服务统计失败:', error)
    return NextResponse.json({ error: '获取服务统计失败' }, { status: 500 })
  }
} 