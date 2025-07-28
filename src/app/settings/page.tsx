import SystemSettings from '@/components/SystemSettings'

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

      {/* 系统设置 */}
      <SystemSettings />
    </div>
  )
} 