import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      // 简单的健康检查，不依赖外部服务
      res.status(200).json({ 
        status: 'healthy', 
        message: 'Application is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown'
      })
    } catch (error) {
      console.error('Health check failed:', error)
      res.status(500).json({ 
        status: 'unhealthy', 
        message: `Health check failed: ${error}` 
      })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
