'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'

interface ScannedService {
  name: string
  type: 'HTTP' | 'GRPC' | 'SYSTEMD' | 'SUPERVISORD' | 'DOCKER' | 'DATABASE' | 'CACHE' | 'CUSTOM'
  status: 'RUNNING' | 'STOPPED' | 'ERROR' | 'UNKNOWN'
  description?: string
  port?: number
  url?: string
  source?: 'system' | 'network'
}

interface ServiceScannerProps {
  onServiceSelect: (service: ScannedService) => void
}

export default function ServiceScanner({ onServiceSelect }: ServiceScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scannedServices, setScannedServices] = useState<ScannedService[]>([])
  const [showModal, setShowModal] = useState(false)
  
  const { showToast, ToastContainer } = useToast()

  // ESC键关闭modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showModal) {
        setShowModal(false)
      }
    }

    if (showModal) {
      document.addEventListener('keydown', handleEscape)
      // 禁止背景滚动
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [showModal])

  const handleScan = async () => {
    setIsScanning(true)
    try {
      const response = await fetch('/api/services/scan', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setScannedServices(data.services || [])
        setShowModal(true)
      } else {
        showToast('error', '扫描失败，请重试')
      }
    } catch {
      showToast('error', '扫描过程中出错，请重试')
    } finally {
      setIsScanning(false)
    }
  }

  const handleServiceSelect = async (service: ScannedService) => {
    try {
      const response = await fetch('/api/admin/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: service.name,
          type: service.type,
          url: service.url || null,
          port: service.port || null,
          description: service.description || '',
          status: service.status
        })
      })

      if (response.ok) {
        const result = await response.json()
        showToast('success', `服务 "${service.name}" 添加成功`)
        setShowModal(false)
        
        // 通知父组件刷新服务列表
        onServiceSelect(result.service)
      } else {
        const errorData = await response.json()
        showToast('error', errorData.error || '添加服务失败')
      }
    } catch {
      showToast('error', '添加服务时出错，请重试')
    }
  }

  const closeModal = () => {
    setShowModal(false)
  }

  const getServiceIcon = (type: string) => {
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
        return '未知服务'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'STOPPED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      case 'ERROR':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <>
      <button
        onClick={handleScan}
        disabled={isScanning}
        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
      >
        {isScanning ? '扫描中...' : '扫描发现服务'}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50">
          {/* 蒙层 */}
          <div 
            className="fixed inset-0 bg-black/30 dark:bg-black/50 transition-opacity duration-300"
            onClick={closeModal}
          ></div>
          
          {/* Modal内容 */}
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full relative z-10">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
                      发现的服务
                    </h3>
                    
                    {scannedServices.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">未发现可添加的服务</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                        {scannedServices.map((service, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                            onClick={() => handleServiceSelect(service)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{getServiceIcon(service.type)}</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {service.name}
                                </span>
                              </div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                                {service.status === 'RUNNING' ? '运行中' : '已停止'}
                              </span>
                            </div>
                            
                            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                              <div>类型: {getTypeLabel(service.type)}</div>
                              {service.port && <div>端口: {service.port}</div>}
                              {service.url && <div>地址: {service.url}</div>}
                              {service.description && <div>描述: {service.description}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={closeModal}
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </>
  )
}