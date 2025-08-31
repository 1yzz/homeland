import type { NextApiRequest, NextApiResponse } from 'next'
import { WatchdogClient } from 'watchdog-grpc-sdk'

let watchdogClient: WatchdogClient | null = null

function getClient() {
  if (!watchdogClient) {
    watchdogClient = new WatchdogClient({
      host: process.env.WATCHDOG_HOST || 'localhost',
      port: parseInt(process.env.WATCHDOG_PORT || '50051', 10),
      timeout: 5000,
    })
  }
  return watchdogClient
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const client = getClient()
      const health = await client.getHealth()
      res.status(200).json(health)
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
