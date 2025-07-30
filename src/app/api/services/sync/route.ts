import { NextResponse } from 'next/server';
import { serviceHealthMonitor } from '@/lib/serviceHealthMonitor';

export async function POST() {
  try {
    console.log('Starting health check results sync...');
    
    // 将内存中的结果同步到数据库
    await serviceHealthMonitor.syncResultsToDatabase();
    
    return NextResponse.json({
      message: 'Health check results synced successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync health check results',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // 获取当前内存中的所有结果
    const results = serviceHealthMonitor.getAllHealthResults();
    const monitoredServices = serviceHealthMonitor.getMonitoredServices();
    
    return NextResponse.json({
      totalResults: results.length,
      monitoredServices: monitoredServices.length,
      results: results.map(result => ({
        serviceId: result.serviceId,
        status: result.status,
        responseTime: result.responseTime,
        lastChecked: result.lastChecked,
        hasError: !!result.error
      })),
      monitoredServiceIds: monitoredServices
    });
  } catch (error) {
    console.error('Get sync status API error:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
} 