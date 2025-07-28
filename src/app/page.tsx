import { prisma } from '@/lib/db'
import HomeServiceMonitor from '@/components/HomeServiceMonitor'

async function getAllServices() {
  try {
    const services = await prisma.service.findMany({
      orderBy: {
        name: 'asc'
      }
    })
    
    // 转换数据库类型到组件期望的类型
    return services.map(service => ({
      id: service.id,
      name: service.name,
      type: service.type,
      url: service.url || undefined,
      port: service.port || undefined,
      description: service.description || undefined,
      status: service.status,
      lastChecked: service.lastChecked.toISOString(),
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString()
    }))
  } catch (error) {
    console.error('数据库连接错误:', error)
    return []
  }
}

async function getServiceStats() {
  try {
    const [total, running, stopped, error] = await Promise.all([
      prisma.service.count(),
      prisma.service.count({ where: { status: 'RUNNING' } }),
      prisma.service.count({ where: { status: 'STOPPED' } }),
      prisma.service.count({ where: { status: 'ERROR' } })
    ])
    return { total, running, stopped, error }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    return { total: 0, running: 0, stopped: 0, error: 0 }
  }
}

export default async function Home() {
  const [allServices, stats] = await Promise.all([
    getAllServices(),
    getServiceStats()
  ])

  return <HomeServiceMonitor initialServices={allServices} initialStats={stats} />
}
