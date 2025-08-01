'use client'

import { useState, useEffect, useCallback } from 'react'
import ServiceForm from './ServiceForm'
import ServiceTable from './ServiceTable'
import { useToast } from '@/components/ui/Toast'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'

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

interface ServiceStats {
  total: number
  running: number
  stopped: number
  error: number
}

interface ServiceManagerProps {
  initialServices?: Service[]
  initialStats?: ServiceStats
}

interface ServiceFormData {
  name: string
  type: string
  url: string
  description: string
  healthCheckType: string
  healthCheckUrl: string
  healthCheckCommand: string
  healthCheckScript: string
  healthCheckTimeout: string
  healthCheckInterval: string
  healthCheckRetries: string
  healthCheckExpectedStatus: string
  healthCheckExpectedResponse: string
  healthCheckMethod: string
  healthCheckEnabled: boolean
}

export default function ServiceManager({ initialServices = [] }: ServiceManagerProps) {
  const [services, setServices] = useState<Service[]>(initialServices)
  const [loading, setLoading] = useState(initialServices.length === 0)
  const [showForm, setShowForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  const { showToast, ToastContainer } = useToast()
  const { showConfirm, ConfirmDialogComponent } = useConfirmDialog()

  const refreshServices = useCallback(async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/admin/services')
      if (response.ok) {
        const data = await response.json()
        setServices(data)
      } else {
        showToast('error', '获取服务列表失败')
      }
    } catch {
      showToast('error', '获取服务列表失败')
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (initialServices.length === 0) {
      refreshServices()
    }
  }, [initialServices.length])

  const handleSave = async (serviceData: ServiceFormData) => {
    try {
      const url = editingService ? `/api/admin/services/${editingService.id}` : '/api/admin/services'
      const method = editingService ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      })

      if (response.ok) {
        showToast('success', editingService ? '服务更新成功' : '服务创建成功')
        setShowForm(false)
        setEditingService(null)
        refreshServices()
      } else {
        const errorData = await response.json()
        showToast('error', `保存失败: ${errorData.error}`)
      }
    } catch {
      showToast('error', '保存失败，请重试')
    }
  }

  const handleDelete = async (service: Service) => {
    showConfirm({
      title: '删除服务',
      message: `确定要删除服务 "${service.name}" 吗？此操作不可撤销。`,
      confirmText: '删除',
      cancelText: '取消',
      type: 'danger',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/services/${service.id}`, {
            method: 'DELETE',
          })

          if (response.ok) {
            showToast('success', '服务删除成功')
            refreshServices()
          } else {
            const errorData = await response.json()
            showToast('error', `删除失败: ${errorData.error}`)
          }
        } catch {
          showToast('error', '删除失败，请重试')
        }
      }
    })
  }



  const handleEdit = (service: Service) => {
    setEditingService(service)
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingService(null)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingService(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">服务列表</h2>
          <p className="text-gray-600 dark:text-gray-300">管理所有服务</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => refreshServices()}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {refreshing ? '刷新中...' : '刷新'}
          </button>
          <button
            onClick={handleAdd}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            添加服务
          </button>
        </div>
      </div>

      {showForm ? (
        <ServiceForm
          service={editingService}
          onSave={handleSave}
          onCancel={handleCancel}
          loading={false}
        />
      ) : (
        <ServiceTable
          services={services}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      )}

      <ToastContainer />
      <ConfirmDialogComponent />
    </div>
  )
}