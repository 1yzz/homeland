import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceIds = searchParams.get('serviceIds');

    if (!serviceIds) {
      return NextResponse.json(
        { error: 'Service IDs are required' },
        { status: 400 }
      );
    }

    const ids = serviceIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));

    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'No valid service IDs provided' },
        { status: 400 }
      );
    }

    // 批量获取服务状态，包括最新的健康检查结果
    const services = await prisma.service.findMany({
      where: {
        id: { in: ids }
      },
      include: {
        healthChecks: {
          where: { enabled: true },
          take: 1
        },
        healthCheckResults: {
          orderBy: { lastChecked: 'desc' },
          take: 1
        }
      }
    });

    // 格式化返回数据
    const formattedServices = services.map(service => ({
      id: service.id,
      name: service.name,
      type: service.type,
      status: service.status,
      url: service.url,
      port: service.port,
      description: service.description,
      lastChecked: service.lastChecked,
      healthCheck: service.healthChecks[0] || null,
      lastHealthResult: service.healthCheckResults[0] || null
    }));

    return NextResponse.json(formattedServices);
  } catch (error) {
    console.error('Service status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 