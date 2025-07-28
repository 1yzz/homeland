import { globalHealthMonitor } from './serviceHealthMonitor';

/**
 * 应用启动时的初始化函数
 */
export async function initializeApp() {
  try {
    console.log('Initializing Homeland application...');
    
    // 启动全局健康监控
    await globalHealthMonitor.startGlobalMonitoring();
    
    console.log('Application initialization completed');
  } catch (error) {
    console.error('Application initialization failed:', error);
  }
}

/**
 * 应用关闭时的清理函数
 */
export function cleanupApp() {
  try {
    console.log('Cleaning up Homeland application...');
    
    // 停止全局健康监控
    globalHealthMonitor.stopGlobalMonitoring();
    
    console.log('Application cleanup completed');
  } catch (error) {
    console.error('Application cleanup failed:', error);
  }
} 