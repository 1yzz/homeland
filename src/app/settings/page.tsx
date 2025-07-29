export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          系统设置
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          管理系统的各项设置和配置
        </p>
      </div>

      {/* 设置内容 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          服务监控系统
        </h3>
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              <strong>系统说明：</strong>本系统提供服务发现、监控和管理功能。
              健康检查在后端自动运行，前端通过SSR获取最新数据。
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">监控频率</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                健康检查：每1分钟<br/>
                数据同步：每5分钟
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">数据保留</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                健康检查结果：24小时<br/>
                仅记录错误日志
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 