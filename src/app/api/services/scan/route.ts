import { NextResponse } from 'next/server'
import { AdaptiveServiceDiscovery } from '@/lib/adaptiveServiceDiscovery'
import { environmentDetector } from '@/lib/environmentDetector'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    console.log('开始自适应服务扫描')
    
    // 检测环境并获取扫描策略
    const envInfo = await environmentDetector.detectEnvironment()
    const strategy = environmentDetector.getRecommendedScanStrategy()
    const modeDescription = environmentDetector.getScanModeDescription()
    
    console.log(`运行环境: ${envInfo.isDocker ? 'Docker容器' : '主机'}`)
    console.log(`扫描策略: ${strategy}`)
    console.log(`扫描模式: ${modeDescription}`)
    
    // 获取已存在的服务，避免重复推荐
    const existingServices = await prisma.service.findMany({
      select: { name: true, port: true }
    })
    
    const existingKeys = new Set(
      existingServices.map(s => `${s.name}-${s.port || 'noport'}`)
    )
    
    // 使用自适应服务发现
    const serviceDiscovery = new AdaptiveServiceDiscovery()
    const discoveredServices = await serviceDiscovery.scanServices()
    
    console.log(`发现 ${discoveredServices.length} 个服务`)
    
    // 过滤掉已存在于数据库中的服务
    const uniqueServices = discoveredServices.filter(service => {
      const key = `${service.name}-${service.port || 'noport'}`
      return !existingKeys.has(key)
    })
    
    // 按类型和状态排序
    uniqueServices.sort((a, b) => {
      // 运行中的服务排在前面
      if (a.status !== b.status) {
        return a.status === 'RUNNING' ? -1 : 1
      }
      // 按服务类型排序
      return a.type.localeCompare(b.type)
    })
    
    console.log(`过滤后剩余 ${uniqueServices.length} 个新服务`)
    
    // 统计信息
    const summary = {
      total: uniqueServices.length,
      running: uniqueServices.filter(s => s.status === 'RUNNING').length,
      stopped: uniqueServices.filter(s => s.status === 'STOPPED').length,
      systemd: uniqueServices.filter(s => s.type === 'SYSTEMD').length,
      supervisord: uniqueServices.filter(s => s.type === 'SUPERVISORD').length,
      docker: uniqueServices.filter(s => s.type === 'DOCKER').length,
      http: uniqueServices.filter(s => s.type === 'HTTP').length,
      grpc: uniqueServices.filter(s => s.type === 'GRPC').length,
      database: uniqueServices.filter(s => s.type === 'DATABASE').length,
      cache: uniqueServices.filter(s => s.type === 'CACHE').length
    }
    
    return NextResponse.json({ 
      message: '扫描完成', 
      services: uniqueServices,
      count: uniqueServices.length,
      summary,
      environment: {
        isDocker: envInfo.isDocker,
        strategy,
        description: modeDescription,
        capabilities: envInfo.scanCapabilities
      }
    })
  } catch (error) {
    console.error('扫描服务失败:', error)
    
    // 返回友好的错误信息
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    
    return NextResponse.json({ 
      error: `扫描服务失败: ${errorMessage}`,
      services: [],
      count: 0,
      summary: { total: 0, running: 0, stopped: 0, systemd: 0, supervisord: 0, docker: 0, http: 0, grpc: 0, database: 0, cache: 0 },
      environment: null
    }, { status: 500 })
  }
}