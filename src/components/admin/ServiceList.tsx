'use client'

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

interface ServiceListProps {
  services: Service[]
  onEdit: (service: Service) => void
  onDelete: (service: Service) => void
  onControl: (service: Service, action: 'start' | 'stop') => void
  loading: boolean
}

export default function ServiceList({ services, onEdit, onDelete, onControl, loading }: ServiceListProps) {
  // 获取状态样式
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

  // 获取服务类型图标
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

  // 获取服务类型标签
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

  if (services.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📦</div>
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          还没有任何服务
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
          点击"添加新服务"开始管理您的服务
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        服务列表 ({services.length})
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {services.map((service) => (
          <div
            key={service.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            {/* 服务头部信息 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getTypeIcon(service.type)}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {service.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {getTypeLabel(service.type)}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                {getStatusLabel(service.status)}
              </span>
            </div>

            {/* 服务详情 */}
            <div className="space-y-2 mb-4">
              {service.port && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">端口:</span>
                  <span className="font-mono text-sm text-gray-900 dark:text-white">{service.port}</span>
                </div>
              )}
              
              {service.url && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">URL:</span>
                  <a
                    href={service.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  >
                    {service.url}
                  </a>
                </div>
              )}

              {service.description && (
                <div className="flex items-start space-x-2">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">描述:</span>
                  <span className="text-sm text-gray-900 dark:text-white">{service.description}</span>
                </div>
              )}


            </div>

            {/* 操作按钮 */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                {/* 启动/停止按钮 */}
                {service.status === 'RUNNING' ? (
                  <button
                    onClick={() => onControl(service, 'stop')}
                    disabled={loading}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                  >
                    ⏹️ 停止
                  </button>
                ) : (
                  <button
                    onClick={() => onControl(service, 'start')}
                    disabled={loading}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                  >
                    ▶️ 启动
                  </button>
                )}
              </div>

              <div className="flex space-x-2">
                {/* 编辑按钮 */}
                <button
                  onClick={() => onEdit(service)}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                >
                  ✏️ 编辑
                </button>

                {/* 删除按钮 */}
                <button
                  onClick={() => onDelete(service)}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                >
                  🗑️ 删除
                </button>
              </div>
            </div>

            {/* 最后检查时间 */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                最后检查: {new Date(service.lastChecked).toLocaleString('zh-CN')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}