'use client'

import { useSystemStore } from '@/lib/store'

export default function SystemSettings() {
  const { 
    localIP, 
    autoReplaceLocalhost, 
    setAutoReplaceLocalhost,
    fetchLocalIP 
  } = useSystemStore()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        系统设置
      </h3>
      
      <div className="space-y-4">
        {/* IP地址设置 */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">本机IP地址</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {localIP || '未获取'}
            </p>
          </div>
          <button
            onClick={fetchLocalIP}
            className="px-3 py-1 text-xs font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 transition-colors"
          >
            刷新
          </button>
        </div>

        {/* 自动替换设置 */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">自动替换localhost</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              访问服务时自动将localhost替换为实际IP地址
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoReplaceLocalhost}
              onChange={(e) => setAutoReplaceLocalhost(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* 功能说明 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>功能说明：</strong>启用后，访问服务时会自动将URL中的localhost替换为实际IP地址，方便从其他设备访问服务。
          </p>
        </div>
      </div>
    </div>
  )
} 