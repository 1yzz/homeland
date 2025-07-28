'use client';

import { useState, useEffect } from 'react';
import ServiceCard from '@/components/ServiceCard';
import Link from 'next/link';

interface Service {
  id: number;
  name: string;
  type: 'HTTP' | 'GRPC' | 'SYSTEMD' | 'SUPERVISORD' | 'DOCKER' | 'DATABASE' | 'CACHE' | 'CUSTOM';
  url?: string;
  port?: number;
  description?: string;
  status: 'RUNNING' | 'STOPPED' | 'ERROR' | 'STARTING' | 'STOPPING';
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
}

export default function HomeServiceMonitor({ initialServices, initialStats }: HomeServiceMonitorProps) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [stats, setStats] = useState(initialStats);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isStartingMonitor, setIsStartingMonitor] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // 启动全局监控
  const startGlobalMonitoring = async () => {
    setIsStartingMonitor(true);
    try {
      const response = await fetch('/api/services/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start-global-monitoring' })
      });

      if (response.ok) {
        const result = await response.json();
        setIsMonitoring(result.isMonitoring);
        console.log('✅ 全局监控已启动');
      } else {
        console.error('❌ 启动全局监控失败');
      }
    } catch (error) {
      console.error('❌ 启动全局监控出错:', error);
    } finally {
      setIsStartingMonitor(false);
    }
  };

  // 获取监控状态
  const fetchMonitoringStatus = async () => {
    try {
      const response = await fetch('/api/services/monitor?action=global-status');
      if (response.ok) {
        const status = await response.json();
        setIsMonitoring(status.isMonitoring);
      }
    } catch (error) {
      console.error('获取监控状态失败:', error);
    }
  };

  // 刷新服务状态
  const refreshServices = async () => {
    try {
      const response = await fetch('/api/admin/services');
      if (response.ok) {
        const freshServices = await response.json();
        
        // 转换数据格式
        const formattedServices = freshServices.map((service: any) => ({
          id: service.id,
          name: service.name,
          type: service.type,
          url: service.url || undefined,
          port: service.port || undefined,
          description: service.description || undefined,
          status: service.status,
          lastChecked: new Date(service.lastChecked).toISOString(),
          createdAt: new Date(service.createdAt).toISOString(),
          updatedAt: new Date(service.updatedAt).toISOString()
        }));

        setServices(formattedServices);
        
        // 更新统计
        const running = formattedServices.filter((s: Service) => s.status === 'RUNNING').length;
        const stopped = formattedServices.filter((s: Service) => s.status === 'STOPPED').length;
        const error = formattedServices.filter((s: Service) => s.status === 'ERROR').length;
        const total = formattedServices.length;
        
        setStats({ total, running, stopped, error });
        setLastUpdate(new Date());
        
        console.log(`🔄 服务状态已更新 - 运行中: ${running}, 已停止: ${stopped}, 错误: ${error}, 总计: ${total}`);
      }
    } catch (error) {
      console.error('刷新服务状态失败:', error);
    }
  };

  // 组件挂载时启动监控和定时刷新
  useEffect(() => {
    // 获取初始监控状态
    fetchMonitoringStatus();
    
    // 如果监控未启动，自动启动
    setTimeout(() => {
      if (!isMonitoring && !isStartingMonitor) {
        startGlobalMonitoring();
      }
    }, 1000);

    // 设置定时刷新（每10秒刷新一次服务状态）
    const refreshInterval = setInterval(refreshServices, 10000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, [isMonitoring, isStartingMonitor]);

  // 分离不同状态的服务
  const runningServices = services.filter(service => service.status === 'RUNNING');
  const stoppedServices = services.filter(service => service.status === 'STOPPED');
  const errorServices = services.filter(service => service.status === 'ERROR');
  const otherServices = services.filter(service => !['RUNNING', 'STOPPED', 'ERROR'].includes(service.status));

  return (
    <div className="space-y-8">
      {/* 页面标题和操作区域 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            服务概览
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            监控和管理系统中的所有服务
          </p>
        </div>
        <div className="flex space-x-3 items-center">
          {/* 监控状态指示器 */}
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
            <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {isStartingMonitor ? '启动中...' : (isMonitoring ? '监控中' : '已停止')}
            </span>
          </div>
          
          <Link
            href="/services"
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            服务管理
          </Link>
        </div>
      </div>

      {/* 实时状态栏 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <p className="text-blue-700 dark:text-blue-300 text-sm font-medium">
                实时监控已启用
              </p>
              <p className="text-blue-600 dark:text-blue-400 text-xs">
                上次更新: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <button
            onClick={refreshServices}
            className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
          >
            立即刷新
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">总服务数</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">运行中</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.running}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17.25 15M10 14l-1-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">已停止</p>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.stopped}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.888-.833-2.598 0L4.216 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">错误</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.error || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 运行中的服务列表 */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          运行中的服务 ({runningServices.length})
        </h2>
        
        {runningServices.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="text-gray-400 text-6xl mb-4">🚀</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
              当前没有运行中的服务
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              前往服务管理页面添加新服务或启动已停止的服务
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {runningServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>


      {/* 错误服务列表 */}
      {errorServices.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-red-600 dark:text-red-400 mb-4">
            ⚠️ 错误服务 ({errorServices.length})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {errorServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      )}

      
      {/* 已停止的服务列表 */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          已停止的服务 ({stoppedServices.length})
        </h2>
        
        {stoppedServices.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="text-gray-400 text-6xl mb-4">⏸️</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
              没有已停止的服务
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              所有服务都在正常运行中
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stoppedServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>

      {/* 其他状态服务列表 */}
      {otherServices.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-yellow-600 dark:text-yellow-400 mb-4">
            🔄 其他状态服务 ({otherServices.length})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 