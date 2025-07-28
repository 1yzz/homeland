'use client'

import { useState, useEffect } from 'react'
import ServiceScanner from './ServiceScanner'

interface Service {
  id: number
  name: string
  type: 'HTTP' | 'GRPC' | 'SYSTEMD' | 'SUPERVISORD' | 'DOCKER' | 'DATABASE' | 'CACHE' | 'CUSTOM'
  url?: string
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

const HEALTH_CHECK_TYPES = [
  { value: 'HTTP', label: 'HTTP检查' },
  { value: 'TCP', label: 'TCP端口检查' },
  { value: 'COMMAND', label: '命令检查' },
  { value: 'SCRIPT', label: '脚本检查' },
]

export default function ServiceForm({ service, onSave, onCancel, loading }: ServiceFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'HTTP',
    url: '',
    description: '',
    // 健康检查配置
    healthCheckType: 'HTTP',
    healthCheckUrl: '',
    healthCheckCommand: '',
    healthCheckScript: '',
    healthCheckTimeout: '10000',
    healthCheckInterval: '300000',
    healthCheckRetries: '3',
    healthCheckExpectedStatus: '200',
    healthCheckExpectedResponse: '',
    healthCheckMethod: 'GET',
    healthCheckEnabled: true,
  })

  useEffect(() => {
    if (service) {
      // 获取服务的健康检查配置
      const fetchHealthCheckConfig = async () => {
        try {
          const response = await fetch(`/api/admin/services/${service.id}`);
          if (response.ok) {
            const serviceData = await response.json();
            const healthCheck = serviceData.healthChecks?.[0]; // 获取第一个健康检查配置
            
            setFormData({
              name: service.name || '',
              type: service.type || 'HTTP',
              url: service.url || '',
              description: service.description || '',
              // 健康检查配置 - 从数据库获取
              healthCheckType: healthCheck?.type || 'HTTP',
              healthCheckUrl: healthCheck?.url || '',
              healthCheckCommand: healthCheck?.command || '',
              healthCheckScript: healthCheck?.script || '',
              healthCheckTimeout: healthCheck?.timeout?.toString() || '10000',
              healthCheckInterval: healthCheck?.interval?.toString() || '300000',
              healthCheckRetries: healthCheck?.retries?.toString() || '3',
              healthCheckExpectedStatus: healthCheck?.expectedStatus?.toString() || '200',
              healthCheckExpectedResponse: healthCheck?.expectedResponse || '',
              healthCheckMethod: healthCheck?.method || 'GET',

              healthCheckEnabled: healthCheck?.enabled ?? true,
            });
          }
        } catch (error) {
          console.error('获取健康检查配置失败:', error);
          // 如果获取失败，使用默认值
      setFormData({
        name: service.name || '',
        type: service.type || 'HTTP',
        url: service.url || '',
        description: service.description || '',
            // 健康检查配置 - 默认值
            healthCheckType: 'HTTP',
            healthCheckUrl: '',
            healthCheckCommand: '',
            healthCheckScript: '',
            healthCheckTimeout: '10000',
            healthCheckInterval: '300000',
            healthCheckRetries: '3',
            healthCheckExpectedStatus: '200',
            healthCheckExpectedResponse: '',
            healthCheckMethod: 'GET',

            healthCheckEnabled: true,
          });
        }
      };

      fetchHealthCheckConfig();
    } else {
      // 新建服务时使用默认值
      setFormData({
        name: '',
        type: 'HTTP',
        url: '',
        description: '',
        // 健康检查配置 - 默认值
        healthCheckType: 'HTTP',
        healthCheckUrl: '',
        healthCheckCommand: '',
        healthCheckScript: '',
        healthCheckTimeout: '10000',
        healthCheckInterval: '300000',
        healthCheckRetries: '3',
        healthCheckExpectedStatus: '200',
        healthCheckExpectedResponse: '',
        healthCheckMethod: 'GET',
        
        healthCheckEnabled: true,
      });
    }
  }, [service]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // 处理headers字段
    let parsedHeaders = null;
    if (formData.healthCheckHeaders && formData.healthCheckHeaders.trim()) {
      try {
        parsedHeaders = JSON.parse(formData.healthCheckHeaders);
      } catch (error) {
        console.error('Headers格式错误:', error);
        alert('Headers格式错误，请检查JSON格式');
        return;
      }
    }

    const data = {
      name: formData.name,
      type: formData.type,
      url: formData.url || null,
      description: formData.description || null,
      status: 'STOPPED',
      // 健康检查配置
      healthCheck: {
        type: formData.healthCheckType,
        url: formData.healthCheckUrl || null,
        command: formData.healthCheckCommand || null,
        script: formData.healthCheckScript || null,
        timeout: parseInt(formData.healthCheckTimeout),
        interval: parseInt(formData.healthCheckInterval),
        retries: parseInt(formData.healthCheckRetries),
        expectedStatus: formData.healthCheckExpectedStatus ? parseInt(formData.healthCheckExpectedStatus) : null,
        expectedResponse: formData.healthCheckExpectedResponse || null,
        method: formData.healthCheckMethod,
        headers: parsedHeaders,
        body: formData.healthCheckBody || null,
        enabled: formData.healthCheckEnabled,
      }
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
      description: scannedService.description || '',
    }))
  }

  // 根据服务类型生成示例配置
  const getExampleConfig = () => {
    switch (formData.type) {
      case 'HTTP':
        return {
          healthCheckType: 'HTTP',
          healthCheckUrl: formData.url || 'http://localhost:8080/health',
          healthCheckExpectedStatus: '200',
          healthCheckMethod: 'GET',
        }
      case 'DATABASE':
        return {
          healthCheckType: 'COMMAND',
          healthCheckCommand: 'mysqladmin ping -h localhost',
          healthCheckExpectedResponse: 'mysqld is alive',
        }
      case 'SYSTEMD':
        return {
          healthCheckType: 'COMMAND',
          healthCheckCommand: `systemctl is-active ${formData.name}`,
          healthCheckExpectedResponse: 'active',
        }
      default:
        return {}
    }
  }

  const applyExampleConfig = () => {
    const example = getExampleConfig()
    setFormData(prev => ({
      ...prev,
      ...example
    }))
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {service ? '编辑服务' : '添加新服务'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 服务扫描 */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">自动扫描服务</h4>
          <ServiceScanner onServiceSelect={handleServiceSelect} />
        </div>

        {/* 基本信息 */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">基本信息</h4>
          
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="例如: nginx, mysql, redis"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              服务类型 *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {SERVICE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                服务URL
            </label>
            <input
              type="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="例如: http://localhost:8080"
            />
          </div>


        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              描述
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="服务的详细描述..."
          />
          </div>
        </div>

        {/* 健康检查配置 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-900 dark:text-white">健康检查配置</h4>
            <button
              type="button"
              onClick={applyExampleConfig}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              应用示例配置
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                检查类型
              </label>
              <select
                name="healthCheckType"
                value={formData.healthCheckType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {HEALTH_CHECK_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                检查URL
              </label>
              <input
                type="url"
                name="healthCheckUrl"
                value={formData.healthCheckUrl}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="例如: http://localhost:8080/health"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                超时时间 (ms)
              </label>
              <input
                type="number"
                name="healthCheckTimeout"
                value={formData.healthCheckTimeout}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="10000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                检查间隔 (ms)
              </label>
              <input
                type="number"
                name="healthCheckInterval"
                value={formData.healthCheckInterval}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="30000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                重试次数
              </label>
              <input
                type="number"
                name="healthCheckRetries"
                value={formData.healthCheckRetries}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="3"
              />
            </div>
          </div>

          {/* 命令检查配置 */}
          {formData.healthCheckType === 'COMMAND' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                检查命令
              </label>
              <input
                type="text"
                name="healthCheckCommand"
                value={formData.healthCheckCommand}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="例如: systemctl is-active nginx"
              />
            </div>
          )}

          {/* HTTP检查配置 */}
          {formData.healthCheckType === 'HTTP' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    HTTP方法
                  </label>
                  <select
                    name="healthCheckMethod"
                    value={formData.healthCheckMethod}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    期望状态码
                  </label>
                  <input
                    type="number"
                    name="healthCheckExpectedStatus"
                    value={formData.healthCheckExpectedStatus}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  HTTP Headers (JSON格式)
                </label>
                <textarea
                  name="healthCheckHeaders"
                  value={formData.healthCheckHeaders}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder={"{\"Content-Type\": \"application/json\", \"Authorization\": \"Bearer token\"}"}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  请输入有效的JSON格式，例如: {'{"Content-Type": "application/json"}'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Request Body
                </label>
                <textarea
                  name="healthCheckBody"
                  value={formData.healthCheckBody}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="请求体内容 (可选)"
                />
              </div>
            </>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              name="healthCheckEnabled"
              checked={formData.healthCheckEnabled}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              启用健康检查
            </label>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? '保存中...' : (service ? '更新服务' : '创建服务')}
          </button>
        </div>
      </form>
    </div>
  )
}