'use client'

import { useToast } from '@/components/ui/Toast'
import { useSystemStore } from '@/lib/store'

interface Service {
  id: number
  name: string
  type: 'HTTP' | 'GRPC' | 'SYSTEMD' | 'SUPERVISORD' | 'DOCKER' | 'DATABASE' | 'CACHE' | 'CUSTOM'
  url?: string
  port?: number
  status: 'RUNNING' | 'STOPPED' | 'ERROR' | 'STARTING' | 'STOPPING'
  description?: string
  lastChecked: string
  createdAt: string
  updatedAt: string
}

interface ServiceCardProps {
  service: Service
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const { ToastContainer } = useToast()
  const { replaceLocalhostWithIP } = useSystemStore()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'STOPPED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      case 'ERROR':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'STARTING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'STOPPING':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'HTTP':
        return '🌐'
      case 'GRPC':
        return '⚡'
      case 'SYSTEMD':
        return '🔧'
      case 'SUPERVISORD':
        return '👥'
      case 'DOCKER':
        return '🐳'
      case 'DATABASE':
        return '🗄️'
      case 'CACHE':
        return '💨'
      default:
        return '📦'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'HTTP':
        return 'HTTP服务'
      case 'GRPC':
        return 'gRPC服务'
      case 'SYSTEMD':
        return 'Systemd服务'
      case 'SUPERVISORD':
        return 'Supervisord服务'
      case 'DOCKER':
        return 'Docker容器'
      case 'DATABASE':
        return '数据库服务'
      case 'CACHE':
        return '缓存服务'
      default:
        return '自定义服务'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return '运行中'
      case 'STOPPED':
        return '已停止'
      case 'ERROR':
        return '错误'
      case 'STARTING':
        return '启动中'
      case 'STOPPING':
        return '停止中'
      default:
        return '未知'
    }
  }

  // 获取访问URL，自动替换localhost
  const getAccessUrl = () => {
    if (!service.url) return null
    
    // 使用全局store的替换函数
    return replaceLocalhostWithIP(service.url)
  }

  const accessUrl = getAccessUrl()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <span className="text-2xl">{getTypeIcon(service.type)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {service.name}
              </h3>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(service.status)}`}>
                {getStatusLabel(service.status)}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {getTypeLabel(service.type)}
            </p>
            {service.description && (
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
                {service.description}
              </p>
            )}
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              {service.port && (
                <span>端口: {service.port}</span>
              )}
              {accessUrl && (
                <span className="text-blue-600 dark:text-blue-400 font-mono">
                  {accessUrl}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col space-y-2">
          {/* 访问服务按钮 */}
          {accessUrl ? (
            <a
              href={accessUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              访问
            </a>
          ) : (
            <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
              无URL
            </span>
          )}
        </div>
      </div>

      <ToastContainer />
    </div>
  )
}