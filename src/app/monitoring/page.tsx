export default function MonitoringPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          系统监控
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          监控系统资源使用情况和服务性能
        </p>
      </div>

      {/* 占位符内容 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            系统监控功能
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            此功能正在开发中，将提供以下监控能力：
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">系统资源监控</h4>
              <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <li>• CPU 使用率</li>
                <li>• 内存使用情况</li>
                <li>• 磁盘 I/O</li>
                <li>• 网络流量</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">服务监控</h4>
              <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <li>• 服务健康检查</li>
                <li>• 响应时间监控</li>
                <li>• 错误率统计</li>
                <li>• 日志分析</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 简单的系统信息展示 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">系统负载</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">即将推出</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">内存使用</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">即将推出</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">磁盘使用</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">即将推出</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}