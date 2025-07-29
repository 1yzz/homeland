import Link from 'next/link';
import ServiceCard from './ServiceCard';

interface Service {
  id: number;
  name: string;
  type: 'HTTP' | 'GRPC' | 'SYSTEMD' | 'SUPERVISORD' | 'DOCKER' | 'DATABASE' | 'CACHE' | 'CUSTOM';
  url?: string;
  port?: number;
  status: 'RUNNING' | 'STOPPED' | 'ERROR' | 'STARTING' | 'STOPPING';
  description?: string;
  lastChecked: string;
  createdAt: string;
  updatedAt: string;
}


interface HomeServiceMonitorProps {
  initialServices: Service[];
  initialStats: {
    total: number;
    running: number;
    stopped: number;
    error?: number;
  };
  isMonitoring: boolean;
  lastGlobalCheck?: string;
  pageGeneratedAt: string;
}

export default function HomeServiceMonitor({ 
  initialServices, 
  initialStats, 
    isMonitoring,
  lastGlobalCheck,
  pageGeneratedAt
}: HomeServiceMonitorProps) {

  // 按状态分组服务
  const runningServices = initialServices.filter(service => service.status === 'RUNNING');
  const errorServices = initialServices.filter(service => service.status === 'ERROR');
  const stoppedServices = initialServices.filter(service => service.status === 'STOPPED');
  const otherServices = initialServices.filter(service => 
    !['RUNNING', 'ERROR', 'STOPPED'].includes(service.status)
  );

  return (
    <div className="space-y-8">
      {/* 页面标题和操作 */}
      <div>
        <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              服务监控中心
          </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              实时监控您的服务状态和健康状况
          </p>
        </div>
          
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            手动刷新
          </Link>
        </div>
      </div>

      {/* 状态信息 */}
      {lastGlobalCheck && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-blue-700 dark:text-blue-300 text-sm font-medium">
            后端健康检查 - 最后检查时间: {new Date(lastGlobalCheck).toLocaleString('zh-CN')}
          </p>
        </div>
      )}

      {/* 动态SSR提示 */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <p className="text-green-700 dark:text-green-300 text-sm">
              服务端渲染 - 页面生成时间: {pageGeneratedAt} | 自动更新已启用
            </p>
          </div>
          <Link
            href="/"
            className="px-3 py-1 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded text-xs font-medium hover:bg-green-200 dark:hover:bg-green-700 transition-colors"
          >
            刷新数据
          </Link>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">总服务数</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{initialStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">运行中</p>
              <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{initialStats.running}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">已停止</p>
              <p className="text-2xl font-semibold text-gray-600 dark:text-gray-400">{initialStats.stopped}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">错误</p>
              <p className="text-2xl font-semibold text-red-600 dark:text-red-400">{initialStats.error || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 监控状态 */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-lg font-medium text-gray-900 dark:text-white">
              全局监控状态: {isMonitoring ? '后端监控中' : '监控已停止'}
            </span>
          </div>
        </div>
      </div>
        
      {/* 服务列表 */}
      {initialServices.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">暂无服务</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">开始添加服务来监控它们的状态</p>
          <div className="mt-6">
            <Link
              href="/services"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              添加服务
            </Link>
          </div>
          </div>
        ) : (
        <div className="space-y-8">
          {/* 运行中的服务 */}
          {runningServices.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <h2 className="text-xl font-semibold text-green-600 dark:text-green-400">
                  运行中的服务 ({runningServices.length})
                </h2>
              </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {runningServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
              </div>
            </div>
          )}

          {/* 错误状态的服务 */}
          {errorServices.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
                  错误状态服务 ({errorServices.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {errorServices.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
          </div>
        )}

          {/* 其他状态的服务 (启动中、停止中) */}
          {otherServices.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                <h2 className="text-xl font-semibold text-yellow-600 dark:text-yellow-400">
                  状态变更中 ({otherServices.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherServices.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
      </div>
          )}

          {/* 已停止的服务 */}
          {stoppedServices.length > 0 && (
      <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400">
          已停止的服务 ({stoppedServices.length})
        </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stoppedServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
              </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
} 