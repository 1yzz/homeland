'use client'

import { useEffect, useState } from 'react'
import { useSystemStore } from '@/lib/store'

export default function IPDisplay() {
  const [mounted, setMounted] = useState(false)
  const { 
    localIP, 
    isLoadingIP, 
    ipError, 
    fetchLocalIP 
  } = useSystemStore()

  useEffect(() => {
    setMounted(true)
    if (!localIP) {
      fetchLocalIP()
    }
  }, [localIP, fetchLocalIP])

  // 在服务器端渲染时显示占位符
  if (!mounted) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <span className="text-blue-600 dark:text-blue-400 text-xs">🌐</span>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-900 dark:text-white">本机IP</p>
            <p className="text-xs text-gray-600 dark:text-gray-300 font-mono">加载中...</p>
          </div>
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500">
          <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
            网络
          </span>
        </div>
      </div>
    )
  }

  if (isLoadingIP) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <span className="text-blue-600 dark:text-blue-400 text-xs">🌐</span>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-900 dark:text-white">本机IP</p>
            <p className="text-xs text-gray-600 dark:text-gray-300 font-mono">加载中...</p>
          </div>
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500">
          <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
            网络
          </span>
        </div>
      </div>
    )
  }

  if (ipError || !localIP) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <span className="text-blue-600 dark:text-blue-400 text-xs">🌐</span>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-900 dark:text-white">本机IP</p>
            <p className="text-xs text-gray-600 dark:text-gray-300 font-mono">未知</p>
          </div>
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500">
          <button
            onClick={fetchLocalIP}
            className="inline-flex items-center px-2 py-1 rounded-full bg-red-50 text-red-700 dark:bg-red-900/50 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/70"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
          <span className="text-blue-600 dark:text-blue-400 text-xs">🌐</span>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-900 dark:text-white">本机IP</p>
          <p className="text-xs text-gray-600 dark:text-gray-300 font-mono">{localIP}</p>
        </div>
      </div>
      <div className="text-xs text-gray-400 dark:text-gray-500">
        <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
          网络
        </span>
      </div>
    </div>
  )
} 