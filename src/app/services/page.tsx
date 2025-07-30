import { prisma } from '@/lib/db'
import ServiceManager from '@/components/admin/ServiceManager'

// 禁用静态生成，使用动态渲染
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getServicesData() {
  try {
    // 并行获取数据以提高性能
    const [allServices, stats] = await Promise.all([
      // 获取所有服务
      prisma.service.findMany({
        orderBy: { createdAt: 'desc' }
      }),
      // 使用聚合查询直接获取统计数据
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
      total: allServices.length,
      running: statsMap['RUNNING'] || 0,
      stopped: statsMap['STOPPED'] || 0,
      error: statsMap['ERROR'] || 0
    }

    return { services: allServices, stats: finalStats }
  } catch (error) {
    console.error('获取服务数据失败:', error)
    return { services: [], stats: { total: 0, running: 0, stopped: 0, error: 0 } }
  }
}

export default async function ServicesPage() {
  const { services, stats } = await getServicesData()

  return (
    <ServiceManager 
      initialServices={services} 
      initialStats={stats}
    />
  )
}