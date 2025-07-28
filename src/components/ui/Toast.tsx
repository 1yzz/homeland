'use client'

import { useState, useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  type: ToastType
  message: string
  duration?: number
  onClose: () => void
}

const Toast = ({ type, message, duration = 5000, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <div className="w-5 h-5 text-green-500">✓</div>
      case 'error':
        return <div className="w-5 h-5 text-red-500">✕</div>
      case 'warning':
        return <div className="w-5 h-5 text-yellow-500">⚠</div>
      case 'info':
        return <div className="w-5 h-5 text-blue-500">ℹ</div>
    }
  }

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    }
  }

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full ${getBgColor()} border rounded-lg shadow-lg p-4 transition-all duration-300 ease-in-out`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {message}
          </p>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={onClose}
            className="inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <div className="w-4 h-4">×</div>
          </button>
        </div>
      </div>
    </div>
  )
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, duration?: number) => void
  ToastContainer: () => React.ReactElement
}

export const useToast = (): ToastContextType => {
  const [toasts, setToasts] = useState<Array<{ id: number; type: ToastType; message: string; duration?: number }>>([])

  const showToast = (type: ToastType, message: string, duration?: number) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, type, message, duration }])
  }

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )

  return {
    showToast,
    ToastContainer
  }
} 