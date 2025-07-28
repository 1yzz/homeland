import { NextResponse } from 'next/server'
import { networkInterfaces } from 'os'

export async function GET() {
  try {
    const nets = networkInterfaces()
    const results: { [key: string]: string[] } = {}

    for (const name of Object.keys(nets)) {
      const net = nets[name]
      if (net) {
        for (const netInterface of net) {
          // 跳过内部地址和非IPv4地址
          if (netInterface.family === 'IPv4' && !netInterface.internal) {
            if (!results[name]) {
              results[name] = []
            }
            results[name].push(netInterface.address)
          }
        }
      }
    }

    // 获取主要的外部IP地址
    let primaryIP = ''
    const interfaces = ['eth0', 'en0', 'wlan0', 'wlan1', 'eno1', 'ens33']
    
    for (const iface of interfaces) {
      if (results[iface] && results[iface].length > 0) {
        primaryIP = results[iface][0]
        break
      }
    }

    // 如果没有找到主要接口，使用第一个可用的IP
    if (!primaryIP) {
      for (const iface in results) {
        if (results[iface] && results[iface].length > 0) {
          primaryIP = results[iface][0]
          break
        }
      }
    }

    return NextResponse.json({
      ip: primaryIP || '未知',
      interfaces: results
    })
  } catch (error) {
    console.error('获取IP地址失败:', error)
    return NextResponse.json(
      { ip: '未知', error: '获取IP地址失败' },
      { status: 500 }
    )
  }
} 