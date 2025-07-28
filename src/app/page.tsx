import { prisma } from '@/lib/db'
import ServiceCard from '@/components/ServiceCard'
import Link from 'next/link'

async function getRunningServices() {
  try {
    const services = await prisma.Service.findMany({
      where: {
        status: 'RUNNING'
      },
      orderBy: {
        port: 'asc'
      }
    })
    return services
  } catch (error) {
    console.error('数据库连接错误:', error)
    return []
  }
}

async function getStoppedServices() {
  try {
    const services = await prisma.Service.findMany({
      where: {
        status: 'STOPPED'
      },
      orderBy: {
        name: 'asc'
      }
    })
    return services
  } catch (error) {
    console.error('数据库连接错误:', error)
    return []
  }
}

async function getServiceStats() {
  try {
    const [total, running, stopped] = await Promise.all([
      prisma.Service.count(),
      prisma.Service.count({ where: { status: 'RUNNING' } }),
      prisma.Service.count({ where: { status: 'STOPPED' } })
    ])
    return { total, running, stopped }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    return { total: 0, running: 0, stopped: 0 }
  }
}

export default async function Home() {
  const [runningServices, stoppedServices, stats] = await Promise.all([
    getRunningServices(),
    getStoppedServices(),
    getServiceStats()
  ])

  return (
    <div className="space-y-8">
      {/* 页面标题和操作区域 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            服务概览
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            监控和管理系统中的所有服务
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/services"
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            服务管理
          </Link>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">总服务数</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">运行中</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.running}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17.25 15M10 14l-1-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">已停止</p>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.stopped}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 运行中的服务列表 */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          运行中的服务 ({runningServices.length})
        </h2>
        
        {runningServices.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="text-gray-400 text-6xl mb-4">🚀</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
              当前没有运行中的服务
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              前往服务管理页面添加新服务或启动已停止的服务
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {runningServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>

      {/* 已停止的服务列表 */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          已停止的服务 ({stoppedServices.length})
        </h2>
        
        {stoppedServices.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="text-gray-400 text-6xl mb-4">⏸️</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
              没有已停止的服务
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              所有服务都在正常运行中
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stoppedServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
