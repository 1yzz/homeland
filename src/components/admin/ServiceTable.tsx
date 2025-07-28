'use client'

import { useToast } from '@/components/ui/Toast'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'

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

interface ServiceTableProps {
  services: Service[]
  onEdit: (service: Service) => void
  onDelete: (service: Service) => void
  onControl: (service: Service, action: 'start' | 'stop') => void
  loading: boolean
}

export default function ServiceTable({ services, onEdit, onDelete, onControl, loading }: ServiceTableProps) {
  const { showToast, ToastContainer } = useToast()
  const { showConfirm, ConfirmDialogComponent } = useConfirmDialog()

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

  const handleDelete = (service: Service) => {
    showConfirm({
      title: '删除服务',
      message: `确定要删除服务 "${service.name}" 吗？此操作不可撤销。`,
      confirmText: '删除',
      cancelText: '取消',
      type: 'danger',
      onConfirm: () => onDelete(service)
    })
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="text-gray-400 text-6xl mb-4">📋</div>
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
          还没有任何服务
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-sm">
          点击"添加服务"来创建第一个服务
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              服务
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              类型
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              状态
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              端口/URL
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              最后检查
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {services.map((service) => (
            <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <span className="text-lg mr-2">{getTypeIcon(service.type)}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {service.name}
                    </div>
                    {service.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {service.description}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {getTypeLabel(service.type)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(service.status)}`}>
                  {getStatusLabel(service.status)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {service.port && (
                    <div>端口: {service.port}</div>
                  )}
                  {service.url && (
                    <a
                      href={service.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                    >
                      {service.url}
                    </a>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {new Date(service.lastChecked).toLocaleString('zh-CN')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  {/* 启动/停止按钮 */}
                  {service.status === 'RUNNING' ? (
                    <button
                      onClick={() => onControl(service, 'stop')}
                      disabled={loading}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                    >
                      停止
                    </button>
                  ) : (
                    <button
                      onClick={() => onControl(service, 'start')}
                      disabled={loading}
                      className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                    >
                      启动
                    </button>
                  )}

                  {/* 编辑按钮 */}
                  <button
                    onClick={() => onEdit(service)}
                    disabled={loading}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                  >
                    编辑
                  </button>

                  {/* 删除按钮 */}
                  <button
                    onClick={() => handleDelete(service)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                  >
                    删除
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ToastContainer />
      <ConfirmDialogComponent />
    </div>
  )
} 