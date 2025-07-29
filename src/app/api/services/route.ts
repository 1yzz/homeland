import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // 直接从数据库获取所有服务，不进行自动扫描
    const allServices = await prisma.service.findMany({
      orderBy: {
        port: 'asc'
      }
    })
    
    return NextResponse.json(allServices)
  } catch (error) {
    console.error('获取服务失败:', error)
    return NextResponse.json({ error: '获取服务失败' }, { status: 500 })
  }
}

// POST method removed - use /api/admin/services for service creation