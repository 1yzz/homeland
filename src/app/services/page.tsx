import { prisma } from '@/lib/db'
import ServiceManager from '@/components/admin/ServiceManager'

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

export default async function ServicesPage() {
  const stats = await getServiceStats()

  return (
    <div className="space-y-6">
      {/* 页面标题和操作区域 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            服务管理
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            查看和管理系统中的所有服务
          </p>
        </div>
      </div>

      {/* 服务统计标签 */}
      <div className="flex flex-wrap gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow px-4 py-2 border-l-4 border-blue-500">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">总服务数:</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.total}</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow px-4 py-2 border-l-4 border-green-500">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">运行中:</span>
            <span className="text-lg font-bold text-green-600 dark:text-green-400">{stats.running}</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow px-4 py-2 border-l-4 border-gray-500">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">已停止:</span>
            <span className="text-lg font-bold text-gray-600 dark:text-gray-400">{stats.stopped}</span>
          </div>
        </div>
      </div>

      {/* 服务管理器 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <ServiceManager />
      </div>
    </div>
  )
}