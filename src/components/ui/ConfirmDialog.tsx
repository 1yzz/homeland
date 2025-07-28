'use client'

import { useState } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  type?: 'danger' | 'warning' | 'info'
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
  type = 'info'
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          icon: 'text-red-500'
        }
      case 'warning':
        return {
          button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          icon: 'text-yellow-500'
        }
      default:
        return {
          button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          icon: 'text-blue-500'
        }
    }
  }

  const colors = getColors()

  return (
    <div className="fixed inset-0 z-50">
      {/* 蒙层 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 transition-opacity duration-300"
        onClick={onCancel}
      ></div>
      
      {/* Modal内容 */}
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 sm:mx-0 sm:h-10 sm:w-10">
                <div className={`h-6 w-6 ${colors.icon}`}>
                  {type === 'danger' && '⚠'}
                  {type === 'warning' && '⚠'}
                  {type === 'info' && 'ℹ'}
                </div>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white ${colors.button} focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onCancel}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export const useConfirmDialog = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<{
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    onConfirm: () => void
    type?: 'danger' | 'warning' | 'info'
  } | null>(null)

  const showConfirm = (config: {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    onConfirm: () => void
    type?: 'danger' | 'warning' | 'info'
  }) => {
    setConfig(config)
    setIsOpen(true)
  }

  const hideConfirm = () => {
    setIsOpen(false)
    setConfig(null)
  }

  const ConfirmDialogComponent = () => {
    if (!config) return null

    return (
      <ConfirmDialog
        isOpen={isOpen}
        title={config.title}
        message={config.message}
        confirmText={config.confirmText}
        cancelText={config.cancelText}
        onConfirm={() => {
          config.onConfirm()
          hideConfirm()
        }}
        onCancel={hideConfirm}
        type={config.type}
      />
    )
  }

  return {
    showConfirm,
    ConfirmDialogComponent
  }
} 