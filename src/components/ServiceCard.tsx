interface Service {
  id: number
  name: string
  type: 'HTTP' | 'GRPC' | 'SYSTEMD' | 'SUPERVISORD' | 'DOCKER' | 'DATABASE' | 'CACHE' | 'CUSTOM'
  url: string | null
  port: number | null
  status: 'RUNNING' | 'STOPPED' | 'ERROR' | 'STARTING' | 'STOPPING'
  description: string | null
  lastChecked: Date
  createdAt: Date
  updatedAt: Date
}

interface ServiceCardProps {
  service: Service
}

export default function ServiceCard({ service }: ServiceCardProps) {
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <span className="text-2xl">{getTypeIcon(service.type)}</span>
          </div>
          <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {service.name}
              </h3>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(service.status)}`}>
                {getStatusLabel(service.status)}
              </span>
            </div>
            </div>
          </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <span className="w-16 flex-shrink-0">类型:</span>
          <span className="text-gray-900 dark:text-white">{getTypeLabel(service.type)}</span>
        </div>
        
        {service.description && (
          <div className="flex items-start text-sm text-gray-500 dark:text-gray-400">
            <span className="w-16 flex-shrink-0">描述:</span>
            <span className="text-gray-900 dark:text-white">{service.description}</span>
          </div>
        )}

        {service.url && (
          <div className="flex items-start text-sm text-gray-500 dark:text-gray-400">
            <span className="w-16 flex-shrink-0">地址:</span>
            <a
              href={service.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 font-mono hover:underline break-all"
            >
              {service.url}
            </a>
          </div>
        )}

        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <span className="w-16 flex-shrink-0">检查:</span>
          <span className="text-gray-900 dark:text-white">
            {new Date(service.lastChecked).toLocaleString('zh-CN')}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        {service.url ? (
          <a
            href={service.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
            打开链接
            </a>
          ) : (
            <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
            无访问地址
            </span>
          )}

        <div className="text-xs text-gray-400 dark:text-gray-500">
          ID: {service.id}
        </div>
      </div>
    </div>
  )
}