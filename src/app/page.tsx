import { prisma } from '@/lib/db'
import HomeServiceMonitor from '@/components/HomeServiceMonitor'
import ClientSSEHandler from '@/components/ClientSSEHandler'
import { globalHealthMonitor } from '@/lib/serviceHealthMonitor'

async function getMonitoringStatus() {
  try {
    const isMonitoring = globalHealthMonitor.isMonitoring()
    // 使用更简单的查询，限制结果数量
    const latestCheck = await prisma.service.findFirst({
      where: { 
        lastChecked: { 
          not: undefined 
        } 
      }, 
      orderBy: { lastChecked: 'desc' },
      select: { lastChecked: true },
      take: 1
    })
    return {
      isMonitoring,
      lastGlobalCheck: latestCheck?.lastChecked?.toISOString() || null
    }
  } catch (error) {
    console.error('获取监控状态失败:', error)
    return { isMonitoring: false, lastGlobalCheck: null }
  }
}

export default async function HomePage() {
  // 生成页面时间戳
  const pageGeneratedAt = new Date().toLocaleString('zh-CN')
  
  // 并行获取数据以提高性能
  const [allServices, stats, monitoringStatus] = await Promise.all([
    // 简化查询，只获取基本服务信息
    prisma.service.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        url: true,
        port: true,
        status: true,
        description: true,
        lastChecked: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    // 使用聚合查询直接获取统计数据
    prisma.service.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    }),
    // 并行获取监控状态
    getMonitoringStatus()
  ])

  // 处理统计数据
  const statsMap = stats.reduce((acc, stat) => {
    acc[stat.status] = stat._count.status
    return acc
  }, {} as Record<string, number>)

  const finalStats = {
    total: allServices.length,
    running: statsMap['RUNNING'] || 0,
    stopped: statsMap['STOPPED'] || 0,
    error: statsMap['ERROR'] || 0
  }

  // 将服务数据转换为前端需要的格式
  const services = allServices.map(service => ({
    id: service.id,
    name: service.name,
    type: service.type as 'HTTP' | 'GRPC' | 'SYSTEMD' | 'SUPERVISORD' | 'DOCKER' | 'DATABASE' | 'CACHE' | 'CUSTOM',
    url: service.url || undefined,
    port: service.port !== null ? service.port : undefined,
    status: service.status as 'RUNNING' | 'STOPPED' | 'ERROR' | 'STARTING' | 'STOPPING',
    description: service.description || undefined,
    lastChecked: service.lastChecked?.toISOString() || new Date().toISOString(),
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString()
  }))

  return (
    <>
      <ClientSSEHandler />
      <HomeServiceMonitor 
        initialServices={services} 
        initialStats={finalStats}
        isMonitoring={monitoringStatus.isMonitoring}
        lastGlobalCheck={monitoringStatus.lastGlobalCheck || undefined}
        pageGeneratedAt={pageGeneratedAt}
      />
    </>
  )
}
