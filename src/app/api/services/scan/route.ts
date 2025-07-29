import { NextResponse } from 'next/server'
import { scanRunningServices } from '@/lib/serviceDiscovery'
import { scanAllSystemServices } from '@/lib/systemServiceScanner'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    // 获取已存在的服务，避免重复推荐
    const existingServices = await prisma.service.findMany({
      select: { name: true, port: true }
    })
    
    const existingKeys = new Set(
      existingServices.map(s => `${s.name}-${s.port || 'noport'}`)
    )
    
    // 并行扫描网络服务和系统服务
    const [networkServices, systemServices] = await Promise.allSettled([
      scanRunningServices(),
      scanAllSystemServices()
    ])
    
    const allServices = []
    
    // 添加网络服务扫描结果
    if (networkServices.status === 'fulfilled') {
      // 转换网络服务格式以匹配新的数据结构
      const convertedNetworkServices = networkServices.value.map(service => ({
        name: service.name,
        type: service.type === 'docker-container' ? 'DOCKER' : 'HTTP',
        status: service.status === 'running' ? 'RUNNING' : 'STOPPED',
        description: service.description || `网络扫描发现的${service.type}服务`,
        port: service.port,
        url: service.url,
        source: 'network' // 标记来源
      }))
      allServices.push(...convertedNetworkServices)
    }
    
    // 添加系统服务扫描结果
    if (systemServices.status === 'fulfilled') {
      const servicesWithSource = systemServices.value.map(service => ({
        ...service,
        source: 'system' // 标记来源
      }))
      allServices.push(...servicesWithSource)
    }
    
    // 去重处理：优先保留系统服务，因为它们包含更多信息
    // 同时过滤掉已存在于数据库中的服务
    const uniqueServices = []
    const seenServices = new Set()
    
    // 先添加系统服务
    for (const service of allServices.filter(s => s.source === 'system')) {
      const key = `${service.name}-${service.port || 'noport'}`
      if (!seenServices.has(key) && !existingKeys.has(key)) {
        seenServices.add(key)
        uniqueServices.push(service)
      }
    }
    
    // 再添加不重复的网络服务
    for (const service of allServices.filter(s => s.source === 'network')) {
      const key = `${service.name}-${service.port || 'noport'}`
      if (!seenServices.has(key) && !existingKeys.has(key)) {
        seenServices.add(key)
        uniqueServices.push(service)
      }
    }
    
    // 按类型和状态排序
    uniqueServices.sort((a, b) => {
      // 运行中的服务排在前面
      if (a.status !== b.status) {
        return a.status === 'RUNNING' ? -1 : 1
      }
      // 按服务类型排序
      return a.type.localeCompare(b.type)
    })
    
    return NextResponse.json({ 
      message: '扫描完成', 
      services: uniqueServices,
      count: uniqueServices.length,
      summary: {
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
    })
  } catch (error) {
    console.error('扫描服务失败:', error)
    return NextResponse.json({ error: '扫描服务失败' }, { status: 500 })
  }
}