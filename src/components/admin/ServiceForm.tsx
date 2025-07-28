'use client'

import { useState, useEffect } from 'react'
import ServiceScanner from './ServiceScanner'

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

interface ServiceFormProps {
  service?: Service | null
  onSave: (data: any) => void
  onCancel: () => void
  loading: boolean
}

const SERVICE_TYPES = [
  { value: 'HTTP', label: 'HTTP服务' },
  { value: 'GRPC', label: 'gRPC服务' },
  { value: 'SYSTEMD', label: 'Systemd服务' },
  { value: 'SUPERVISORD', label: 'Supervisord服务' },
  { value: 'DOCKER', label: 'Docker容器' },
  { value: 'DATABASE', label: '数据库服务' },
  { value: 'CACHE', label: '缓存服务' },
  { value: 'CUSTOM', label: '自定义服务' },
]

export default function ServiceForm({ service, onSave, onCancel, loading }: ServiceFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'HTTP',
    url: '',
    port: '',
    description: '',
  })

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || '',
        type: service.type || 'HTTP',
        url: service.url || '',
        port: service.port?.toString() || '',
        description: service.description || '',
      })
    }
  }, [service])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const data = {
      name: formData.name,
      type: formData.type,
      url: formData.url || null,
      port: formData.port ? parseInt(formData.port) : null,
      description: formData.description || null,
      status: 'STOPPED',
    }

    onSave(data)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  // 处理扫描服务选择
  const handleServiceSelect = (scannedService: any) => {
    setFormData(prev => ({
      ...prev,
      name: scannedService.name,
      type: scannedService.type,
      url: scannedService.url || '',
      port: scannedService.port?.toString() || '',
      description: scannedService.description || '',
    }))
  }

  // 根据服务类型生成示例命令


  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {service ? '编辑服务' : '添加新服务'}
        </h3>
        {!service && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">或</span>
            <ServiceScanner onServiceSelect={handleServiceSelect} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 服务名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              服务名称 *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="输入服务名称"
            />
          </div>

          {/* 服务类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              服务类型 *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {SERVICE_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              访问URL
            </label>
            <input
              type="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="http://localhost:3000"
            />
          </div>

          {/* 端口 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              端口号
            </label>
            <input
              type="number"
              name="port"
              value={formData.port}
              onChange={handleChange}
              min="1"
              max="65535"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="3000"
            />
          </div>
        </div>

        {/* 描述 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            服务描述
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="描述这个服务的功能"
          />
        </div>



        {/* 表单按钮 */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            {loading ? '保存中...' : (service ? '更新' : '创建')}
          </button>
        </div>
      </form>
    </div>
  )
}