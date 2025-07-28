import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { scanRunningServices } from '@/lib/serviceDiscovery'

export async function GET() {
  try {
    // 扫描运行中的服务
    const detectedServices = await scanRunningServices()
    
    // 将检测到的服务更新到数据库中
    for (const service of detectedServices) {
      await prisma.service.upsert({
        where: {
          name: service.name
        },
        update: {
          status: service.status === 'running' ? 'RUNNING' : 'STOPPED',
          lastChecked: new Date()
        },
        create: {
          name: service.name,
          url: service.url,
          port: service.port,
          type: service.type === 'docker-container' ? 'DOCKER' : 'HTTP',
          status: service.status === 'running' ? 'RUNNING' : 'STOPPED',
          description: service.description || ''
        }
      })
    }
    
    // 获取所有服务
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

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const service = await prisma.service.create({
      data: {
        name: data.name,
        url: data.url,
        port: data.port,
        type: data.type || 'HTTP',
        status: data.status || 'STOPPED',
        description: data.description || ''
      }
    })
    
    return NextResponse.json(service)
  } catch (error) {
    console.error('创建服务失败:', error)
    return NextResponse.json({ error: '创建服务失败' }, { status: 500 })
  }
}